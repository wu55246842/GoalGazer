import requests
import json
import datetime

BASE_URL = "https://v3.football.api-sports.io"
KEY = "357989348a2be508b3566b1f7d69dcbd"
headers = {"x-apisports-key": KEY}

# Search for matches on the current date and surrounding days
today = datetime.datetime.now().strftime("%Y-%m-%d")
print(f"Searching for league 39 fixtures on today: {today}")

r = requests.get(f"{BASE_URL}/fixtures", headers=headers, params={"league": 39, "date": today})
data = r.json()
print(f"Results for {today}: {data.get('results', 0)}")

# If 0, search for any matches in the last 7 days
if data.get('results', 0) == 0:
    one_week_ago = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    print(f"Searching for league 39 fixtures from {one_week_ago} to {today}...")
    r = requests.get(f"{BASE_URL}/fixtures", headers=headers, params={"league": 39, "from": one_week_ago, "to": today})
    data = r.json()
    print(f"Results for last week: {data.get('results', 0)}")

if data.get('response'):
    for item in data['response']:
        print(f"ID: {item['fixture']['id']} | Date: {item['fixture']['date']} | {item['teams']['home']['name']} vs {item['teams']['away']['name']} | Status: {item['fixture']['status']['short']}")
else:
    print("No recent matches found for season 2025 in the last 7 days.")
