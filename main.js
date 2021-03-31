import Web3 from "web3";
import AWSWebsocketProvider from "./aws-websocket-provider.js";
import InputDataDecoder from "ethereum-input-data-decoder";

const { uniswapRouterAddress } = require("./constants.js");

const ws_endpoint = process.env.AMB_WS_ENDPOINT;
const web3 = new Web3(new AWSWebsocketProvider(ws_endpoint));
const decoder = new InputDataDecoder(`contract_abi.json`);

async function main() {
  var subscription = web3.eth
    .subscribe("pendingTransactions")
    .on("data", function (transactionHash) {
      web3.eth.getTransaction(transactionHash).then((result) => {
        if (result !== null) {
          if (result.to == uniswapRouterAddress) {
            console.log(result);
          }
        }
      });
    });
}

main();
