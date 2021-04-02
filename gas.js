import XHR2 from "xhr2";


export default async function getGasPrice(key = "5916b47474856ea2f6cbbcb7e8fa8af64686471ce5c046985d8923ec6425", callback) {
    const request = new XHR2();
    request.open("GET", "https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key="+key);
    request.addEventListener("load", function(){callback(JSON.parse(this.responseText)['fast'])});
    request.send();
}

// getGasPrice(undefined, function(arg){console.log(arg)});


