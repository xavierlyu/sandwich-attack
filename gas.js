import axios from "axios";

export default async function getGasPrice(
  key = "5916b47474856ea2f6cbbcb7e8fa8af64686471ce5c046985d8923ec6425"
) {
  return await axios
    .get(
      `https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=${key}`,
      { responseType: "json" }
    )
    .then((response) => {
      return {
        fast: response.data.fast / 10.0,
        fastest: response.data.fastest / 10.0,
        safeLow: response.data.safeLow / 10.0,
        average: response.data.average / 10.0,
      };
    });
}

// getGasPrice(undefined, function(arg){console.log(arg)});
