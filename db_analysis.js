import AWS from "aws-sdk";

AWS.config.update({ region: "us-east-2" });


export async function tableAnalytics(){

  var ddb = new AWS.DynamoDB({ });

  const params = {
      // Specify which items in the results are returned.
      FilterExpression: "nonce > :s",
      // Define the expression attribute value, which are substitutes for the values you want to compare.
      ExpressionAttributeValues: {
        ":s": {N: "0"}
      },
      // Set the projection expression, which the the attributes that you want.
      ProjectionExpression: "txto, txfrom, txinput, gas, gasPrice, nonce, txtype, txvalue, attacking",
      TableName: "test_table",
    };
    
  ddb.scan(params, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        data.Items.forEach(function (element, index, array){
          console.log(element);
          console.log(array);
        });
      }
    });
}    


tableAnalytics();