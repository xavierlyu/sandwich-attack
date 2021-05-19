import Web3 from "web3";

import InputDataDecoder from "ethereum-input-data-decoder";

import {
  UNISWAP_ROUTER_ADDRESS,
  WEI,
  UNISWAP_ROUTER_ABI,
  DELTA,
} from "./constants.js";

import { logToDynamo } from "./db_client.js";

const abiDecoder = new InputDataDecoder(UNISWAP_ROUTER_ABI);

const isRopsten = true;

export default async function handleTransaction(
  web3,
  subscription,
  UNISWAP_ROUTER,
  user_wallet,
  transaction
) {
  var victimTxnHash, openTxnHash, closeTxnHash;

  const web3_finalstep = isRopsten
    ? new Web3(
        new Web3.providers.HttpProvider(
          "https://ropsten.infura.io/v3/af1d3ad9016c423282f5875d6e2dc6a7"
        )
      )
    : web3;

  let decodedData = abiDecoder.decodeData(transaction.input);

  if (
    decodedData.method != "swapETHForExactTokens" &&
    decodedData.method != "swapExactETHForTokens"
  ) {
    return;
  }

  if (transaction.value / WEI < 0.1) {
    // if less than 0.1 ETH is being transacted
    console.log("Skipped: amount of ether is too small for profitability");
    return;
  }

  let deadline = parseInt(
    JSON.stringify(decodedData.inputs[3]).slice(1, -1),
    16
  );
  if (deadline < Math.ceil(Date.now() / 1000)) {
    console.log("Skipped: passed deadline");
    return;
  }

  if (transaction.blockHash != null) {
    console.log("Skipped: transaction is no longer pending");
    return;
  }

  let to = decodedData.inputs[1];

  console.log(`POSSIBLE TXN SPOTTED: ${transaction.hash}`);
  subscription.unsubscribe(function (error, success) {
    if (success) console.log("Successfully unsubscribed!");
  });

  victimTxnHash = transaction["hash"];

  let gasPrice = parseInt(transaction["gasPrice"]);
  let newGasPrice = gasPrice * 1.3;

  to = to.map((address) => "0x" + address);

  let tokenAmount = await UNISWAP_ROUTER.methods
    .getAmountsOut(web3.utils.toWei(DELTA.toString(), "Ether"), to)
    .call();

  // calculating deadline
  await web3.eth.getBlock("latest", (error, block) => {
    deadline = block.timestamp + 300; // transaction expires in 300 seconds (5 minutes)
  });

  deadline = web3.utils.toHex(deadline);

  let nonce;
  await web3_finalstep.eth
    .getTransactionCount(user_wallet.address)
    .then((data) => (nonce = data));

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
    gasPrice: parseInt(newGasPrice),
    data: open_encodedABI,
    value: DELTA * WEI,
    chainId: isRopsten ? 3 : 1, // mainnet = 1
    nonce: nonce,
  };

  let rawOpenTransaction;
  await user_wallet.signTransaction(open_tx).then((encodedTransaction) => {
    rawOpenTransaction = encodedTransaction.rawTransaction;
    openTxnHash = encodedTransaction.transactionHash;
  });

  let close_swap = UNISWAP_ROUTER.methods.swapTokensForExactETH(
    (DELTA * WEI).toString(),
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
    gasPrice: parseInt(gasPrice * 0.7),
    data: close_encodedABI,
    value: 1,
    chainId: isRopsten ? 3 : 1, // mainnet = 1
    nonce: nonce + 1,
  };

  let rawCloseTransaction;
  await user_wallet.signTransaction(close_tx).then((encodedTransaction) => {
    rawCloseTransaction = encodedTransaction.rawTransaction;
    closeTxnHash = encodedTransaction.transactionHash;
  });

  web3_finalstep.eth
    .sendSignedTransaction(rawOpenTransaction)
    .on("transactionHash", function (hash) {
      console.log(
        `FRONTRUNNING ${transaction.hash.substring(0, 10)} with ${hash}`
      );
    })
    .on("error", function (error, receipt) {
      console.log("error: ", error.message);
    });

  web3_finalstep.eth
    .sendSignedTransaction(rawCloseTransaction)
    .on("transactionHash", function (hash) {
      console.log(
        `BACK-RUNNING ${transaction.hash.substring(0, 10)} with ${hash}`
      );
    })
    .on("error", function (error, receipt) {
      console.log("error: ", error.message);
    });

  logToDynamo(victimTxnHash, openTxnHash, closeTxnHash);
}
