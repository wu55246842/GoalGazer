from __future__ import annotations

import argparse
import json
import requests
from goalgazer.config import settings

# League IDs: 39=Premier League, 2=UCL, 140=La Liga, 78=Bundesliga, 135=Serie A
LEAGUES = {
    "epl": 39,
    "ucl": 2,
    "liga": 140,
    "bundesliga": 78,
    "seriea": 135,
}

def fetch_recent_matches(league_code: str = "epl", last_n: int = 5, **kwargs):
    if not settings.api_football_key:
        print("Error: API_FOOTBALL_KEY not found in environment variables.")
        return

    league_id = LEAGUES.get(league_code, 39)
    # Dynamic season calculation defaulted to 2023 for Free Tier compatibility
    # The API returns error for 2025 on free plans.
    season = kwargs.get('season', 2023)
    
    url = "https://v3.football.api-sports.io/fixtures"
    headers = {
        "x-apisports-key": settings.api_football_key
    }
    params = {
        "league": league_id,
        "season": season,
        "status": "FT" # Finished matches
    }
    
    print(f"Fetching matches for league {league_code} ({league_id}) in season {season}...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        print(response.text)
        return

    data = response.json()
    fixtures = data.get("response", [])
    
    if not fixtures:
        print(f"No matches found using season={season}.")
        print("Full API Response:", json.dumps(data, indent=2))
        return

    # Client-side sort and limit since 'last' param is not available on free tier
    fixtures.sort(key=lambda x: x['fixture']['date'], reverse=True)
    fixtures = fixtures[:last_n]

    print("\nRecent Matches:")
    print("-" * 60)
    print(f"{'Match ID':<10} | {'Date':<12} | {'Home':<15} vs {'Away':<15} | {'Score'}")
    print("-" * 60)
    
    for item in fixtures:
        f = item['fixture']
        h = item['teams']['home']
        a = item['teams']['away']
        s = item['goals']
        date_str = f['date'][:10]
        
        print(f"{f['id']:<10} | {date_str:<12} | {h['name']:<15} vs {a['name']:<15} | {s['home']}-{s['away']}")
    print("-" * 60)

def get_latest_finished_fixture_id(league_code: str = "epl", season: int = 2023) -> str | None:
    if not settings.api_football_key:
        print("Error: API_FOOTBALL_KEY not found in environment variables.")
        return None

    league_id = LEAGUES.get(league_code, 39)
    url = "https://v3.football.api-sports.io/fixtures"
    headers = {
        "x-apisports-key": settings.api_football_key
    }
    params = {
        "league": league_id,
        "season": season,
        "status": "FT"
    }

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        print(response.text)
        return None

    data = response.json()
    fixtures = data.get("response", [])
    if not fixtures:
        print(f"No matches found using season={season}.")
        print("Full API Response:", json.dumps(data, indent=2))
        return None

    fixtures.sort(key=lambda x: x['fixture']['date'], reverse=True)
    return str(fixtures[0]['fixture']['id'])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--league", default="epl", help="epl, ucl, liga, bundesliga, seriea")
    parser.add_argument("--limit", type=int, default=10, help="Number of matches to show")
    parser.add_argument("--season", type=int, default=2023, help="Season year (e.g. 2023)")
    parser.add_argument("--latest", action="store_true", help="Print latest finished matchId only")
    args = parser.parse_args()

    if args.latest:
        match_id = get_latest_finished_fixture_id(args.league, args.season)
        if match_id:
            print(match_id)
    else:
        fetch_recent_matches(args.league, args.limit, season=args.season)
