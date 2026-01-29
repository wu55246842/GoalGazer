from __future__ import annotations

import argparse
import json
import requests
from goalgazer.config import settings

# League IDs: 39=Premier League, 2=UCL, 140=La Liga, 78=Bundesliga, 135=Serie A, 61=Ligue 1
LEAGUES = {
    "epl": 39,
    "ucl": 2,
    "liga": 140,
    "bundesliga": 78,
    "seriea": 135,
    "ligue1": 61,
}

def fetch_recent_matches(league_code: str = "epl", last_n: int = 5, output_json: bool = False, **kwargs):
    if not settings.api_football_key:
        if output_json:
            print(json.dumps({"error": "API_FOOTBALL_KEY not found"}))
        else:
            print("Error: API_FOOTBALL_KEY not found in environment variables.")
        return

    league_id = LEAGUES.get(league_code, 39)
    # Dynamic season calculation defaulted to 2025
    # The API returns error for 2025 on some free plans, but user requested it.
    season = kwargs.get('season', 2025)
    
    url = "https://v3.football.api-sports.io/fixtures"
    headers = {
        "x-apisports-key": settings.api_football_key
    }
    params = {
        "league": league_id,
        "season": season,
        "status": "FT" # Finished matches
    }
    
    if not output_json:
        print(f"Fetching matches for league {league_code} ({league_id}) in season {season}...")
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        if output_json:
             print(json.dumps({"error": f"API Error {response.status_code}", "details": response.text}))
        else:
            print(f"Error fetching data: {response.status_code}")
            print(response.text)
        return

    data = response.json()
    fixtures = data.get("response", [])
    
    if not fixtures:
        if output_json:
            print(json.dumps([]))
        else:
            print(f"No matches found using season={season}.")
            print("Full API Response:", json.dumps(data, indent=2))
        return

    # Client-side sort and limit since 'last' param is not available on free tier
    fixtures.sort(key=lambda x: x['fixture']['date'], reverse=True)
    fixtures = fixtures[:last_n]

    if output_json:
        # Simplified payload for pipeline
        simplified = []
        for item in fixtures:
            f = item['fixture']
            h = item['teams']['home']
            a = item['teams']['away']
            simplified.append({
                "matchId": str(f['id']),
                "date": f['date'],
                "home": h['name'],
                "away": a['name'],
                "score": f"{item['goals']['home']}-{item['goals']['away']}"
            })
        print(json.dumps(simplified, indent=2))
        return

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

def get_latest_finished_fixture_id(league_code: str = "epl", season: int = 2025) -> str | None:
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
    parser.add_argument("--league", default="epl", help="epl, ucl, liga, bundesliga, seriea, ligue1")
    parser.add_argument("--limit", type=int, default=10, help="Number of matches to show")
    parser.add_argument("--season", type=int, default=2025, help="Season year (e.g. 2025)")
    parser.add_argument("--latest", action="store_true", help="Print latest finished matchId only")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    args = parser.parse_args()

    if args.latest:
        match_id = get_latest_finished_fixture_id(args.league, args.season)
        if match_id:
            print(match_id)
    else:
        fetch_recent_matches(args.league, args.limit, output_json=args.json, season=args.season)
