import { KinesisClient, AddTagsToStreamCommand } from "@aws-sdk/client-kinesis";
import { Kinesis, PutRecordCommand, PutRecordsCommand } from "@aws-sdk/client-kinesis";
import AWS from "aws-sdk";


export default async function logToStream(txData){
    var enc = new TextEncoder();

    const client = new KinesisClient({ region: "us-east-2" , credentials: new AWS.EnvironmentCredentials("AWS")});

    var record = enc.encode(JSON.stringify(txData));

    const params = {
        Data: record,
        StreamName: "test_stream",
        PartitionKey: "Doesn't Matter"
    }
    
    const command = new PutRecordCommand(params);
    
    return await client.send(command);
}