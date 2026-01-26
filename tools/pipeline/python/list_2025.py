import requests
import json

BASE_URL = "https://v3.football.api-sports.io"
KEY = "357989348a2be508b3566b1f7d69dcbd"
headers = {"x-apisports-key": KEY}

print("Fetching ALL response for season 2025, league 39...")
r = requests.get(f"{BASE_URL}/fixtures", headers=headers, params={"league": 39, "season": 2025})
data = r.json()
print(f"Results: {data.get('results', 0)}")
if data.get('response'):
    for item in data['response'][:10]:
        print(f"ID: {item['fixture']['id']} | Date: {item['fixture']['date']} | {item['teams']['home']['name']} vs {item['teams']['away']['name']}")
else:
    print("Response empty.")
