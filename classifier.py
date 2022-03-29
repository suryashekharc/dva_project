import pandas as pd
from googleapiclient import discovery
import json
import time
import sys

#These lines set up the api information. The key is mine, so best not to share it
API_KEY = '<insert API Key>'
client = discovery.build(
  "commentanalyzer",
  "v1alpha1",
  developerKey=API_KEY,
  discoveryServiceUrl="https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1",
  static_discovery=False,
)

location_list = ["SeattleWA_989"]
output = pd.DataFrame(columns=['location_name', 'TOXICITY','SEVERE_TOXICITY','IDENTITY_ATTACK','INSULT','PROFANITY','THREAT','SEXUALLY_EXPLICIT'])

for location in location_list:
    data = pd.read_csv(location + '.csv')
    #print('Shape of the data: ', data.shape)
    location_name = location.split('_')[0]

    #These lines add new columns to the dataframe to populate with toxicity labels later
    data['TOXICITY'] = 0
    data['SEVERE_TOXICITY'] = 0
    data['IDENTITY_ATTACK'] = 0
    data['INSULT'] = 0
    data['PROFANITY'] = 0
    data['THREAT'] = 0
    data['SEXUALLY_EXPLICIT'] = 0
    #print(data)

    i=0
    avg_rating = 0
    while i<data.shape[0]:
        #print(data['body'][i])

        #This sets up the request to be passed to the API
        analyze_request = {
            'comment': { 'text': data['body'][i] },
            'requestedAttributes': {'TOXICITY': {},
                    'SEVERE_TOXICITY': {},
                    'IDENTITY_ATTACK': {},
                    'INSULT': {},
                    'PROFANITY': {},
                    'THREAT': {},
                    'SEXUALLY_EXPLICIT': {}},
            "languages": "en"
        }

        #This passes the request to the API and interprets the output
        response = client.comments().analyze(body=analyze_request).execute()
        rating = [response['attributeScores']['TOXICITY']['summaryScore']['value'],
        response['attributeScores']['SEVERE_TOXICITY']['summaryScore']['value'],
        response['attributeScores']['IDENTITY_ATTACK']['summaryScore']['value'],
        response['attributeScores']['INSULT']['summaryScore']['value'],
        response['attributeScores']['PROFANITY']['summaryScore']['value'],
        response['attributeScores']['THREAT']['summaryScore']['value'],
        response['attributeScores']['SEXUALLY_EXPLICIT']['summaryScore']['value']]

        for k in range(len(rating)):
            data.iat[i, data.columns.get_loc('TOXICITY') + k] = rating[k]

        #print(data)

        time.sleep(1.01) #The sleep ensures that the program does not exceed the 1 QPS quota
        print(rating)
        i += 1

    data.to_csv(location + '_labeled.csv')
    output.loc[len(output.index)] = [
        location_name,
        data['TOXICITY'].mean(),
        data['SEVERE_TOXICITY'].mean(),
        data['IDENTITY_ATTACK'].mean(),
        data['INSULT'].mean(),
        data['PROFANITY'].mean(),
        data['THREAT'].mean(),
        data['SEXUALLY_EXPLICIT'].mean()]
    print(output)

output.to_csv('output.csv')

