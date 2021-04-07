import Web3 from "web3";
import AWSHttpProvider from "./aws-http-provider.js";

const HTTP_ENDPOINT = process.env.AMB_HTTP_ENDPOINT;

const web3 = new Web3(new AWSHttpProvider(HTTP_ENDPOINT));

web3.eth
  .getTransaction(
    "0x1286b9d9d7593280946068b9c26347fdacfbc6a1ad5b839b0f3727e56a7d9a9a"
  )
  .then(console.log);
