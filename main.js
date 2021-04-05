import Web3 from "web3";
import AWSWebsocketProvider from "./aws-websocket-provider.js";

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
import getGasPrice from "./gas.js";
import handleTransaction from "./handleTransaction.js";

const WS_ENDPOINT = process.env.AMB_WS_ENDPOINT;

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

  const UNISWAP_ROUTER = new web3.eth.Contract(
    UNISWAP_ROUTER_ABI,
    UNISWAP_ROUTER_ADDRESS
  );

  const UNISWAP_FACTORY = new web3.eth.Contract(
    UNISWAP_FACTORY_ABI,
    UNISWAP_FACTORY_ADDRESS
  );

  // retrieving gas info
  var gas = await getGasPrice();
  console.log(`Gas Info: ${JSON.stringify(gas)}`);

  // listen for pending txns
  var subscription = web3.eth
    .subscribe("pendingTransactions")
    .on("data", function (transactionHash) {
      web3.eth.getTransaction(transactionHash).then((result) => {
        if (
          result !== null &&
          result.to == UNISWAP_ROUTER_ADDRESS &&
          parseInt(result.gasPrice) / GWEI < gas.average &&
          parseInt(result.gasPrice) / GWEI > gas.safeLow * 0.5
        ) {
          handleTransaction(
            UNISWAP_ROUTER,
            UNISWAP_FACTORY,
            user_wallet,
            result
          );
          subscription.unsubscribe();
          process.exit();
        }
      });
    });
}

main();
