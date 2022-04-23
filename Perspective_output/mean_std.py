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
        temp_df['TOXICITY'].mean(),
        temp_df['SEVERE_TOXICITY'].mean(),
        temp_df['IDENTITY_ATTACK'].mean(),
        temp_df['INSULT'].mean(),
        temp_df['PROFANITY'].mean(),
        temp_df['THREAT'].mean(),
        temp_df['SEXUALLY_EXPLICIT'].mean()]

    fig = tsaplots.plot_acf(temp_df['TOXICITY'], lags=10, title= location_name + ' Autocorrelation Coefficients')
    plt.show()
    j+=1

output = output.sort_values(by=['location_name'])
total = ['score_std',
    output['TOXICITY'].std(),
    output['SEVERE_TOXICITY'].std(),
    output['IDENTITY_ATTACK'].std(),
    output['INSULT'].std(),
    output['PROFANITY'].std(),
    output['THREAT'].std(),
    output['SEXUALLY_EXPLICIT'].std()]
output.loc[len(output.index)] = total
print(output)

output.to_csv('output_mean_std.csv')
