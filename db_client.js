import { KinesisClient, PutRecordCommand, CreateStreamCommand } from "@aws-sdk/client-kinesis";
import AWS from "aws-sdk";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new KinesisClient({ region: "us-east-2" , credentials: new AWS.EnvironmentCredentials("AWS")});
const dbclient = new DynamoDBClient({ region: "us-east-2" });



export async function createStream(){
    const params = {
        ShardCount: 1,
        StreamName: "test_stream"
    }

    const command = new CreateStreamCommand(params);

    return await client.send(command);
}

// Might not use these since it's super annoying
export async function logToStream(txData){
    var enc = new TextEncoder();

    var record = enc.encode(JSON.stringify(txData));

    const params = {
        Data: record,
        StreamName: "test_stream",
        PartitionKey: "Doesn't Matter"
    }
    
    const command = new PutRecordCommand(params);
    
    return await client.send(command);
}

export async function logToDynamo(txData){

    // Sample Block 
    // {
    //     blockHash: null,
    //     blockNumber: null,
    //     from: '0xc394cC794A3776aFC009bf870f9c64cD01b5D808',
    //     gas: 166267,
    //     gasPrice: '53000000000',
    //     hash: '0x2a3fbc7efba4303dd2e401112594229b385521d70b51f9879dfc64362260b60d',
    //     input: '0xfb3bdb41000000000000000000000000000000000000000000000000000000000001115c0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000c394cc794a3776afc009bf870f9c64cd01b5d80800000000000000000000000000000000000000000000000000000000608db1880000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000057c75eccc8557136d32619a191fbcdc88560d711',
    //     nonce: 10,
    //     to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    //     transactionIndex: null,
    //     value: '16901155202472303',
    //     type: '0x0',
    //     v: '0x25',
    //     r: '0xa4e67ac1b99f7e008d188826d1523006bbafe4c3620722c0b08e8df4a5dd6a5b',
    //     s: '0x7ca023468c117b71f045d97286b50ac7e60b1cddfd109bfc9436d514d63f79d3'
    //   }
      
    
    const params = {
        TableName: "test_table",
        Item: {
            txid: {S: txData['hash']},
            gasPrice: {N: txData['gasPrice']},
            gas: {N: txData['gas'].toString()},
            from: {S: txData['from']},
            input: {S: txData['input']},
            nonce: {N: txData['nonce'].toString()},
            to: {S: txData['to']},
            value: {N: txData['value']},
            type: {S: txData['type']}
        },
    };
    
    return await dbclient.send(new PutItemCommand(params));
}

// createStream();//.then(client.send({big: "chungus", chungus: "big"}));
// logToDynamo(    {
//     blockHash: null,
//     blockNumber: null,
//     from: '0xc394cC794A3776aFC009bf870f9c64cD01b5D808',
//     gas: 166267,
//     gasPrice: '53000000000',
//     hash: '0x2a3fbc7efba4303dd2e401112594229b385521d70b51f9879dfc64362260b60d',
//     input: '0xfb3bdb41000000000000000000000000000000000000000000000000000000000001115c0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000c394cc794a3776afc009bf870f9c64cd01b5d80800000000000000000000000000000000000000000000000000000000608db1880000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000057c75eccc8557136d32619a191fbcdc88560d711',
//     nonce: 10,
//     to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
//     transactionIndex: null,
//     value: '16901155202472303',
//     type: '0x0',
//     v: '0x25',
//     r: '0xa4e67ac1b99f7e008d188826d1523006bbafe4c3620722c0b08e8df4a5dd6a5b',
//     s: '0x7ca023468c117b71f045d97286b50ac7e60b1cddfd109bfc9436d514d63f79d3'
//   }).then(console.log);