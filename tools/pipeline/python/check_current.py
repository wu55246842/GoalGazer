import requests
import json

BASE_URL = "https://v3.football.api-sports.io"
KEY = "357989348a2be508b3566b1f7d69dcbd"
headers = {"x-apisports-key": KEY}

r = requests.get(f"{BASE_URL}/leagues", headers=headers, params={"id": 39})
data = r.json()
seasons = data['response'][0]['seasons']
for s in seasons:
    if s['year'] >= 2024:
        print(f"Year: {s['year']}, Current: {s['current']}")
