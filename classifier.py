import pandas as pd
from googleapiclient import discovery
import json
import time
import sys

data = pd.read_csv('SeattleWA_989.csv')


#print('Shape of the data: ', data.shape)
#data.head()
#y_cols = list(data.columns[2:])


#These lines set up the api information. The key is mine, so best not to share it
API_KEY = '<insert your api key here>'
client = discovery.build(
  "commentanalyzer",
  "v1alpha1",
  developerKey=API_KEY,
  discoveryServiceUrl="https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1",
  static_discovery=False,
)

i=0
avg_rating = 0
while i<data.shape[0]:
    #print(data['body'][i])

    #This sets up the request to be passed to the API
    analyze_request = {
        'comment': { 'text': data['body'][i] },
        'requestedAttributes': {'TOXICITY': {}},
        "languages": "en"
    }

    #This passes the request to the API and interprets the output
    response = client.comments().analyze(body=analyze_request).execute()
    rating = response['attributeScores']['TOXICITY']['summaryScore']['value']

    #For now, I've just retained the average toxicity rating,
    #but this code could be easily modified to retain all individual scores
    if i==0:
        avg_rating = rating
    else:
        avg_rating = avg_rating*i/(i+1) + float(rating)/(i+1)
    time.sleep(1.01) #The sleep ensures that the program does not exceed the 1 QPS quota
    print(rating, avg_rating)
    i += 1

print("Final subreddit score:", avg_rating)
