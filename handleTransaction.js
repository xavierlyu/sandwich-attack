import Web3 from "web3";
import AWSHttpProvider from "./aws-http-provider.js";

const {
  UNISWAP_ROUTER_ADDRESS,
  ACCOUNT_ADDRESS,
  UNISWAP_CONTRACT_ABI,
  WEI,
} = require("./constants.js");

const HTTP_ENDPOINT = process.env.AMB_HTTP_ENDPOINT;
const web3;

let uniswapRouter;

async function handleTransaction(transaction, user_wallet) {
  web3 = new Web3(new AWSHttpProvider(HTTP_ENDPOINT));

  uniswapRouter = new web3.eth.Contract(
    UNISWAP_CONTRACT_ABI,
    UNISWAP_ROUTER_ADDRESS
  );

  let gasPrice = parseInt(transaction["gasPrice"]);
  let newGasPrice = gasPrice * 2;
}

module.exports = { handleTransaction };
