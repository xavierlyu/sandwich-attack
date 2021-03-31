/////////////////////////////////////////////////////
// Authored by Carl Youngblood
// Senior Blockchain Solutions Architect, AWS
// Adapted from web3 npm package v1.3.0
// licensed under GNU Lesser General Public License
// https://github.com/ethereum/web3.js
/////////////////////////////////////////////////////

import AWS from "aws-sdk";
import WebsocketProvider from "web3-providers-ws";
import pkg from "websocket";
const { w3cwebsocket } = pkg;
const Ws = w3cwebsocket;

export default class AWSWebsocketProvider extends WebsocketProvider {
  connect() {
    const region = process.env.AWS_DEFAULT_REGION || "us-east-1";
    const credentials = new AWS.EnvironmentCredentials("AWS");
    const host = new URL(this.url).hostname;
    const endpoint = new AWS.Endpoint(`https://${host}/`);
    const req = new AWS.HttpRequest(endpoint, region);
    req.method = "GET";
    req.body = "";
    req.headers["host"] = host;
    const signer = new AWS.Signers.V4(req, "managedblockchain");
    signer.addAuthorization(credentials, new Date());
    const headers = {
      Authorization: req.headers["Authorization"],
      "X-Amz-Date": req.headers["X-Amz-Date"],
      ...this.headers,
    };
    this.connection = new Ws(
      this.url,
      this.protocol,
      undefined,
      headers,
      this.requestOptions,
      this.clientConfig
    );
    this._addSocketListeners();
  }
}
