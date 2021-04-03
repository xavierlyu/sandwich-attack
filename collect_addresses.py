from google.cloud import bigquery
import json

"""
This is not part of the hot path for the application. This just collects
active pairs on Uniswap and their relayers, and is meant to be run infrequently.
Some of this code has been copied/adapted from BigQuery used by asf79's research
group for something else.
"""

client = bigquery.Client()

uniswap_factory = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f"

# Certain Ethereum transactions produce an event. This is the signature of 
# creating a certain pair to trade on Uniswap.
signature = "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9" #PairCreated from V2 factory

# This query is copied. This is in Google's BigQuery language.
query = """SELECT log_index,transaction_hash,address,data,topics,logs.block_timestamp,logs.block_number FROM `bigquery-public-data.crypto_ethereum.logs` AS logs JOIN UNNEST(topics) AS topic WHERE topic IN UNNEST(@topics) ORDER BY block_number ASC"""

topics = set([signature])
aqp = bigquery.ArrayQueryParameter('topics', 'STRING', topics)
query_params = [aqp]
job_config = bigquery.QueryJobConfig()
job_config.query_parameters = query_params
query_job = client.query(
    query,
    # Location must match that of the dataset(s) referenced in the query.
    location='US',
    job_config=job_config)  # API request - starts the query

relayers = set()
pairs = set()

for item in query_job:
    if item['address'] == uniswap_factory:
        if len(item['topics']) == 3:
            token_addr_0 = item['topics'][1]
            token_addr_1 = item['topics'][2]
            relayer = item['data'][2:][24:64]
            relayers.add(relayer)
            pairs.add((token_addr_0, token_addr_1, relayer))

assert query_job.state == 'DONE'

obj = {
    'relayers': list(relayers),
    'pairs': list(relayers)
}

json.dump(obj,  open("uniswap_relayers_pairs.json", "w")) 