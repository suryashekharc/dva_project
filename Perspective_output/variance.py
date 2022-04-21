import pandas as pd
import numpy as np
import math
import os
import json
import sys
from statsmodels.graphics import tsaplots
import matplotlib.pyplot as plt

files = os.listdir()
csv_files = [file for file in files if file.endswith('labeled.csv')]

output = pd.DataFrame(columns=['location_name', 'TOXICITY','SEVERE_TOXICITY','IDENTITY_ATTACK','INSULT','PROFANITY','THREAT','SEXUALLY_EXPLICIT'])

def weight_scale(x):
    return np.where(x>= 0, np.sqrt(x), -np.sqrt(-x))

j=0
for file in csv_files:
    temp_df = pd.read_csv(file)
    #print('Shape of the data: ', data.shape)
    location_name = file.split('_')[0]

    #data.to_csv(location + '_weighted.csv')
    output.loc[len(output.index)] = [
        location_name,
        temp_df['TOXICITY'].std()/math.sqrt(temp_df.shape[0]),
        temp_df['SEVERE_TOXICITY'].std()/math.sqrt(temp_df.shape[0]),
        temp_df['IDENTITY_ATTACK'].std()/math.sqrt(temp_df.shape[0]),
        temp_df['INSULT'].std()/math.sqrt(temp_df.shape[0]),
        temp_df['PROFANITY'].std()/math.sqrt(temp_df.shape[0]),
        temp_df['THREAT'].std()/math.sqrt(temp_df.shape[0]),
        temp_df['SEXUALLY_EXPLICIT'].std()/math.sqrt(temp_df.shape[0])]

    #fig = tsaplots.plot_acf(temp_df['TOXICITY'], lags=10)
    #plt.show()
    j+=1

output = output.sort_values(by=['location_name'])
total = ['average',
    output['TOXICITY'].mean(),
    output['SEVERE_TOXICITY'].mean(),
    output['IDENTITY_ATTACK'].mean(),
    output['INSULT'].mean(),
    output['PROFANITY'].mean(),
    output['THREAT'].mean(),
    output['SEXUALLY_EXPLICIT'].mean()]
output.loc[len(output.index)] = total
print(output)

output.to_csv('output_variance.csv')
