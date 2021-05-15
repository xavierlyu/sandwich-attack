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
  stats['attackingCount'] = attackingTxns.length;
  stats['nonAttackingCount'] = nonAttackingTxns.length;

  var avgAttackGas = 0;
  attackingTxns.forEach((element, _, __) => {
    avgAttackGas += parseInt(element.gas.N);
  });

  if(attackingTxns.length){ 
    avgAttackGas/=attackingTxns.length;
  }
  stats['avgAttackGas'] = avgAttackGas;

  var avgNonAttackGas = 0;
  var avgNonAttackGasPrice = 0;
  var avgTxValue = 0;
  nonAttackingTxns.forEach((element, _, __) => {
    avgNonAttackGas += parseInt(element.gas.N);
    avgNonAttackGasPrice += parseInt(element.gasPrice.N);
    avgTxValue += parseInt(element.txvalue.N);
  });
  if(nonAttackingTxns){
    avgNonAttackGasPrice/=nonAttackingTxns.length;
    avgNonAttackGas/=nonAttackingTxns.length;
    avgTxValue/=nonAttackingTxns.length;
  }
  stats['avgNonAttackGas'] = avgNonAttackGas;
  stats['avgNonAttackGasPrice'] = avgNonAttackGasPrice;
  stats['avgTxValue'] = avgTxValue;

  let uniqueAddresses = new Map();
  let topRelayers = new Map();
  nonAttackingTxns.forEach((element, _, __) => {
    if (uniqueAddresses.has(element.txfrom.S)){
      uniqueAddresses.set(element.txfrom.S, uniqueAddresses.get(element.txfrom.S)+1);
    }else{
      uniqueAddresses.set(element.txfrom.S, 1);
    }

    if (topRelayers.has(element.txto.S)){
      topRelayers.set(element.txto.S, topRelayers.get(element.txto.S)+1);
    } else {
      topRelayers.set(element.txto.S, 1);
    }
  });
  stats['uniqueAddressesAttacked'] = uniqueAddresses.size;
  stats['uniqueRelayersUsed'] = topRelayers.size;
  // magic js that sorts the map
  const mapSort1 = [...uniqueAddresses.entries()].sort((a, b) => b[1] - a[1]);
  const mapSort2 = [...topRelayers.entries()].sort((a, b) => b[1] - a[1]);
  var topAddresses;
  if (mapSort1.length <= 10){
    topAddresses = mapSort1;
  }else {
    topAddresses = mapSort1.slice(0, 10);
  }
  stats['topAddresses'] = topAddresses;

  var top10Relayers;
  if (mapSort2.length <= 10){
    top10Relayers = mapSort2;
  }else {
    top10Relayers = mapSort2.slice(0, 10);
  }
  stats['topRelayers'] = top10Relayers;


  console.log(stats);
  return stats;
}

scanTable().then(dbAnalytics);