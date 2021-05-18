import InputDataDecoder from "ethereum-input-data-decoder";

import {
  UNISWAP_ROUTER_ADDRESS,
  UNISWAP_FACTORY_ADDRESS,
  ACCOUNT_ADDRESS,
  TARGET_TOKEN_ADDRESSES_LIST,
  WEI,
  GWEI,
  UNISWAP_FACTORY_ABI,
  UNISWAP_ROUTER_ABI,
} from "./constants.js";

import { logToDynamo } from "./db_client.js";

const abiDecoder = new InputDataDecoder(UNISWAP_ROUTER_ABI);

export default async function handleTransaction(
  web3,
  subscription,
  UNISWAP_ROUTER,
  user_wallet,
  transaction
) {
  var victimTxnHash, openTxnHash, closeTxnHash;

  let decodedData = abiDecoder.decodeData(transaction.input);

  if (
    decodedData.method != "swapETHForExactTokens" &&
    decodedData.method != "swapExactETHForTokens"
  ) {
    return;
  }

  if (transaction.value / WEI < 0.001) {
    // if less than 0.001 ETH is being transacted
    console.log("too small");
    return;
  }

  let deadline = parseInt(
    JSON.stringify(decodedData.inputs[3]).slice(1, -1),
    16
  );
  if (deadline < Math.ceil(Date.now() / 1000)) {
    console.log(`too late ${transaction.hash}`);
    return;
  }

  if (transaction.blockHash != null) {
    return;
  }

  console.log(`POSSIBLE TXN SPOTTED: ${transaction.hash}`);

  let to = decodedData.inputs[1];

  let amountOut =
    parseInt(JSON.stringify(decodedData.inputs[0]).slice(1, -1), 16) / WEI;
  let targetToken = decodedData.inputs[1][1];

  victimTxnHash = transaction["hash"];

  // TODO double check if `targetToken` is not a stablecoin

  let gasPrice = parseInt(transaction["gasPrice"]);
  let newGasPrice = gasPrice * 1.3;

  to = to.map((address) => "0x" + address);

  let tokenAmount = await UNISWAP_ROUTER.methods
    .getAmountsOut(web3.utils.toWei("0.002", "Ether"), to)
    .call();

  // calculating deadline
  await web3.eth.getBlock("latest", (error, block) => {
    deadline = block.timestamp + 300; // transaction expires in 300 seconds (5 minutes)
  });

  deadline = web3.utils.toHex(deadline);

  let open_swap = UNISWAP_ROUTER.methods.swapETHForExactTokens(
    parseInt(tokenAmount[1] * 0.995).toString(),
    to,
    user_wallet.address,
    deadline
  );

  let open_encodedABI = open_swap.encodeABI();

  let open_tx = {
    from: user_wallet.address,
    to: UNISWAP_ROUTER_ADDRESS,
    gas: (300000).toString(),
    gasPrice: newGasPrice,
    data: open_encodedABI,
    value: 0.002 * WEI, // idk lol this is like $10 USD
    chainId: 1,
  };

  let rawTransaction;
  await user_wallet.signTransaction(open_tx).then((encodedTransaction) => {
    console.log(encodedTransaction);
    rawTransaction = encodedTransaction.rawTransaction;
    openTxnHash = encodedTransaction.transactionHash;
  });

  // await web3.eth
  //   .sendSignedTransaction(rawTransaction)
  //   .on("transactionHash", function (hash) {
  //     console.log("transactionHash: ", hash);
  //   })
  //   .on("confirmation", function (confirmationNumber, receipt) {
  //     console.log("confirmationNumber: ", confirmationNumber);
  //   })
  //   .on("error", function (error, receipt) {
  //     // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
  //     console.log("error: ", error);
  //   });

  // calculating deadline
  await web3.eth.getBlock("latest", (error, block) => {
    deadline = block.timestamp + 600; // transaction expires in 600 seconds (10 minutes)
  });

  deadline = web3.utils.toHex(deadline);

  let close_swap = UNISWAP_ROUTER.methods.swapTokensForExactETH(
    (0.002 * WEI).toString(),
    parseInt(tokenAmount[1] * 0.995).toString(),
    [to[1], to[0]],
    user_wallet.address,
    deadline
  );

  let close_encodedABI = close_swap.encodeABI();

  let close_tx = {
    from: user_wallet.address,
    to: UNISWAP_ROUTER_ADDRESS,
    gas: (300000).toString(),
    gasPrice: gasPrice / 2,
    data: close_encodedABI,
    value: 0.002 * WEI, // idk lol this is like $10 USD
    chainId: 1,
  };

  await user_wallet.signTransaction(close_tx).then((encodedTransaction) => {
    rawTransaction = encodedTransaction.rawTransaction;
    closeTxnHash = encodedTransaction.transactionHash;
  });

  logToDynamo(victimTxnHash, openTxnHash, closeTxnHash);

  // await web3.eth
  //   .sendSignedTransaction(rawTransaction)
  //   .on("transactionHash", function (hash) {
  //     console.log("transactionHash: ", hash);
  //   })
  //   .on("confirmation", function (confirmationNumber, receipt) {
  //     console.log("confirmationNumber: ", confirmationNumber);
  //   })
  //   .on("error", function (error, receipt) {
  //     // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
  //     console.log("error: ", error);
  //   });
}
