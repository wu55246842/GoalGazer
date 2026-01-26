import os
import requests
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parents[3] / ".env"
load_dotenv(env_path)

BASE_URL = "https://v3.football.api-sports.io"
KEY = os.getenv("API_FOOTBALL_KEY")
headers = {"x-apisports-key": KEY}

def search_now():
    print("Searching for league 39 fixtures in Jan 2026 (Season 2025)...")
    r = requests.get(f"{BASE_URL}/fixtures", headers=headers,
                     params={"league": 39, "season": 2025, "from": "2026-01-01", "to": "2026-01-27"}, timeout=30)
    data = r.json()
    fixtures = data.get("response", [])
    print(f"Found {len(fixtures)} fixtures")
    for item in fixtures[:10]:
        print(f"ID: {item['fixture']['id']} | Date: {item['fixture']['date']} | {item['teams']['home']['name']} vs {item['teams']['away']['name']} | Status: {item['fixture']['status']['short']}")

search_now()
