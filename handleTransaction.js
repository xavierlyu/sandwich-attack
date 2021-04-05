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

const HTTP_ENDPOINT = process.env.AMB_HTTP_ENDPOINT;
const abiDecoder = new InputDataDecoder(UNISWAP_ROUTER_ABI);
const web3 = new Web3(new AWSHttpProvider(HTTP_ENDPOINT));

let uniswapRouter;

export default function handleTransaction(
  UNISWAP_ROUTER,
  UNISWAP_FACTORY,
  user_wallet,
  transaction
) {
  let decodedData = abiDecoder.decodeData(transaction.input);

  if (decodedData.method == "swapETHForExactTokens") {
    console.log(transaction);
    console.log(abiDecoder.decodeData(transaction.input));
  } else {
    return;
  }

  let gasPrice = parseInt(transaction["gasPrice"]);
  let newGasPrice = gasPrice * 2;
}
