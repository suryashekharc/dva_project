import pandas as pd
import numpy as np
import math
import os
import json
import sys

files = os.listdir()
csv_files = [file for file in files if file.endswith('labeled.csv')]

output = pd.DataFrame(columns=['location_name', 'TOXICITY','SEVERE_TOXICITY','IDENTITY_ATTACK','INSULT','PROFANITY','THREAT','SEXUALLY_EXPLICIT'])

def weight_scale(x):
    return np.where(x>= 0, np.sqrt(x), -np.sqrt(-x))

for file in csv_files:
    temp_df = pd.read_csv(file)
    #print('Shape of the data: ', data.shape)
    location_name = file.split('_')[0]

    temp_df['weight'] = temp_df['score'].apply(weight_scale)

    #data.to_csv(location + '_weighted.csv')
    output.loc[len(output.index)] = [
        location_name,
        (temp_df['TOXICITY']*temp_df['weight']).sum() / temp_df['weight'].sum(),
        (temp_df['SEVERE_TOXICITY']*temp_df['weight']).sum() / temp_df['weight'].sum(),
        (temp_df['IDENTITY_ATTACK']*temp_df['weight']).sum() / temp_df['weight'].sum(),
        (temp_df['INSULT']*temp_df['weight']).sum() / temp_df['weight'].sum(),
        (temp_df['PROFANITY']*temp_df['weight']).sum() / temp_df['weight'].sum(),
        (temp_df['THREAT']*temp_df['weight']).sum() / temp_df['weight'].sum(),
        (temp_df['SEXUALLY_EXPLICIT']*temp_df['weight']).sum() / temp_df['weight'].sum()]

output = output.sort_values(by=['location_name'])
print(output)

output.to_csv('output_sqrt_weighted.csv')
