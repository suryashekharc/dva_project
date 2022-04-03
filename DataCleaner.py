import pandas as pd

dict = {
"NewHampshire":"New Hampshire",
"NewJersey":"New Jersey",
"NewMexico":"New Mexico",
"NewYork":"New York",
"NorthCarolina":"North Carolina",
"NorthDakota":"North Dakota",
"RhodeIsland":"Rhode Island",
"SouthCarolina":"South Carolina",
"SouthDakota":"South Dakota",
"WashingtonDC":"District of Columbia",
"WestVirginia":"West Virginia"
}

df = pd.read_csv("output.csv")

for idx, row in df.iterrows():
    if df.loc[idx, 'location_name'] in dict:
        df.loc[idx, 'location_name'] = dict[df.loc[idx, 'location_name']]

df.to_csv("output_clean.csv", index=False)