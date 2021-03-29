import requests
import sys, os, time
import json

# One hour refresh time
REFRESH_TIME = 3600

# My key from DeFi Pulse
API_KEY = "5916b47474856ea2f6cbbcb7e8fa8af64686471ce5c046985d8923ec6425"


def get_gas_price(key = API_KEY):
    res = requests.get("https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key={}".format(key))
    # response must be ok
    assert(res.ok)

    resContent = json.loads(res.content)
    assert('fast' in resContent)
    return resContent['fast']


if __name__ == "__main__":
    print(get_gas_price())