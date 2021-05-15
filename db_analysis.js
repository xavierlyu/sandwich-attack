import AWS from "aws-sdk";

AWS.config.update({ region: "us-east-2" });


export async function scanTable(){

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
    
  // ddb.scan(params, function(err, data) {
  //     if (err) {
  //       console.log("Error", err);
  //     } else {
  //       data.Items.forEach(function (element, index, array){
  //         console.log(element);
  //         console.log(array);
  //       });
  //     }
  //   });

   return await new Promise((resolve, reject) => {
     ddb.scan(params, (err, data) => {
        if (err) reject(err);
        resolve(data);
        })
   }); 
}    


function dbAnalytics(data){
  var attackingTxns = [];
  var nonAttackingTxns = [];
  var stats = {}
  data.Items.forEach((element, _, __) => {
    if(element['attacking']['BOOL']){
      attackingTxns.push(element);
    }else{
      nonAttackingTxns.push(element);
    }
  });
  console.log(attackingTxns);
  console.log(nonAttackingTxns);
  stats['attackingCount'] = attackingTxns.length;
  stats['nonAttackingCount'] = nonAttackingTxns.length;

  console.log(stats);
  return stats;
}

scanTable().then(dbAnalytics);