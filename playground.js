import Web3 from "web3";
import AWSHttpProvider from "./aws-http-provider.js";

import { UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI } from "./constants.js";

const HTTP_ENDPOINT = process.env.AMB_HTTP_ENDPOINT;

const web3 = new Web3(new AWSHttpProvider(HTTP_ENDPOINT));

// setting up accounts
const user_wallet = web3.eth.accounts.privateKeyToAccount(
  process.env.ACCOUNT_PRIVATE_KEY
);

const UNISWAP_ROUTER = new web3.eth.Contract(
  UNISWAP_ROUTER_ABI,
  UNISWAP_ROUTER_ADDRESS
);

// calculating deadline
let deadline;
await web3.eth.getBlock("latest", (error, block) => {
  deadline = block.timestamp + 300; // transaction expires in 300 seconds (5 minutes)
});

deadline = web3.utils.toHex(deadline);

let tokenAmount = await UNISWAP_ROUTER.methods
  .getAmountsOut(web3.utils.toWei("0.5", "Ether"), [
    "0xA2b4C0Af19cC16a6CfAcCe81F192B024d625817D",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  ])
  .call();

let close_swap = UNISWAP_ROUTER.methods.swapTokensForExactETH(
  "1995430000000000",
  "671070725644619615000000000",
  [
    "0xA2b4C0Af19cC16a6CfAcCe81F192B024d625817D",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  ],
  user_wallet.address,
  deadline
);

let close_encodedABI = close_swap.encodeABI();

let close_tx = {
  from: user_wallet.address,
  to: UNISWAP_ROUTER_ADDRESS,
  gas: (300000).toString(),
  gasPrice: "100",
  data: close_encodedABI,
  value: 0,
  chainId: 1,
};

let rawTransaction;
await user_wallet.signTransaction(close_tx).then((encodedTransaction) => {
  rawTransaction = encodedTransaction.rawTransaction;
});

await web3.eth
  .sendSignedTransaction(rawTransaction)
  .on("transactionHash", function (hash) {
    console.log("transactionHash: ", hash);
  })
  .on("confirmation", function (confirmationNumber, receipt) {
    console.log("confirmationNumber: ", confirmationNumber);
  })
  .on("error", function (error, receipt) {
    // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    console.log("error: ", error);
  });
