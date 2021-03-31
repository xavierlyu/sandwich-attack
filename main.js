import Web3 from "web3";
import AWSWebsocketProvider from "./aws-websocket-provider.js";
import InputDataDecoder from "ethereum-input-data-decoder";

const {
  UNISWAP_ROUTER_ADDRESS,
  ACCOUNT_ADDRESS,
  WEI,
} = require("./constants.js");

const WS_ENDPOINT = process.env.AMB_WS_ENDPOINT;
const decoder = new InputDataDecoder(`contract_abi.json`);

let web3;
let user_wallet;
let balance; // in ether

async function main() {
  // setting up web3
  web3 = new Web3(new AWSWebsocketProvider(WS_ENDPOINT));

  // setting up accounts
  user_wallet = web3.eth.accounts.privateKeyToAccount(
    process.env.ACCOUNT_PRIVATE_KEY
  );

  balance = web3.eth.getBalance(user_wallet.address) / WEI; // in ether

  // retrieving gas info

  // listen for pending txns
  var subscription = web3.eth
    .subscribe("pendingTransactions")
    .on("data", function (transactionHash) {
      web3.eth.getTransaction(transactionHash).then((result) => {
        if (result !== null) {
          if (result.to == UNISWAP_ROUTER_ADDRESS) {
            console.log(result);
          }
        }
      });
    });
}

main();
