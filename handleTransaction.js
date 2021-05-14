import Web3 from "web3";
import AWSHttpProvider from "./aws-http-provider.js";
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

const HTTP_ENDPOINT = process.env.AMB_HTTP_ENDPOINT;
const abiDecoder = new InputDataDecoder(UNISWAP_ROUTER_ABI);
const web3 = new Web3(new AWSHttpProvider(HTTP_ENDPOINT));

let uniswapRouter;

export default async function handleTransaction(
  UNISWAP_ROUTER,
  UNISWAP_FACTORY,
  user_wallet,
  transaction
) {
  let decodedData = abiDecoder.decodeData(transaction.input);

  if (decodedData.method != "swapETHForExactTokens") {
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

  console.log(transaction);

  let to = decodedData.inputs[1];

  let amountOut =
    parseInt(JSON.stringify(decodedData.inputs[0]).slice(1, -1), 16) / WEI;
  let targetToken = decodedData.inputs[1][1];

  // TODO double check if `targetToken` is not a stablecoin

  logToDynamo(transaction, false);

  let gasPrice = parseInt(transaction["gasPrice"]);
  let newGasPrice = gasPrice * 2;

  to = to.map((address) => "0x" + address);

  const tokenAmount = await UNISWAP_ROUTER.methods
    .getAmountsOut(web3.utils.toWei("1", "Ether"), to)
    .call();

  console.log(tokenAmount[1].toString());

  // calculating deadline
  await web3.eth.getBlock("latest", (error, block) => {
    deadline = block.timestamp + 300; // transaction expires in 300 seconds (5 minutes)
  });

  deadline = web3.utils.toHex(deadline);

  let swap = UNISWAP_ROUTER.methods.swapETHForExactTokens(
    tokenAmount[1].toString(),
    to,
    user_wallet.address,
    deadline
  );

  let encodedABI = swap.encodeABI();

  let tx = {
    from: user_wallet.address,
    to: UNISWAP_ROUTER_ADDRESS,
    gas: (300000).toString(),
    gasPrice: newGasPrice,
    data: encodedABI,
    value: 0.002 * WEI, // idk lol this is like $10 USD
    chainId: 1,
  };

  let rawTransaction;
  await user_wallet.signTransaction(tx).then((encodedTransaction) => {
    console.log(encodedTransaction);
    rawTransaction = encodedTransaction.rawTransaction;
    logToDynamo({
      from: tx.from,
      to: tx.to,
      hash: encodedTransaction.transactionHash,
      gas: tx.gas,
      input: tx.data,
      gasPrice: 0,
      nonce: 0,
      value: tx.value,
      type: "0x0",
      attacking: true
    });
  });

  await web3.eth
    .sendSignedTransaction(rawTransaction)
    .on("transactionHash", function (hash) {
      console.log("transactionHash: ", hash);
    })
    .on("confirmation", function (confirmationNumber, receipt) {
      console.log("confirmationNumber: ", confirmationNumber);
      console.log("receipt: ", receipt);
    })
    .on("receipt", function (receipt) {
      console.log("receipt: ", receipt);
    })
    .on("error", function (error, receipt) {
      // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      console.log("error: ", error);
      console.log("receipt: ", receipt);
    });
}
