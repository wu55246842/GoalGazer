from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict
import requests

from .config import settings

BASE_URL = "https://v3.football.api-sports.io"


def _cached_request(endpoint: str, params: dict, cache_path: Path) -> Dict[str, Any]:
    if cache_path.exists():
        return json.loads(cache_path.read_text())

    if not settings.api_football_key:
        raise RuntimeError("API_FOOTBALL_KEY is not set")

    headers = {"x-apisports-key": settings.api_football_key}
    response = requests.get(f"{BASE_URL}/{endpoint}", params=params, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(data, indent=2))
    time.sleep(0.4)
    return data


def fetch_fixture(match_id: str) -> Dict[str, Any]:
    cache_path = settings.cache_dir / match_id / "fixture.json"
    return _cached_request("fixtures", {"id": match_id}, cache_path)


def fetch_events(match_id: str) -> Dict[str, Any]:
    cache_path = settings.cache_dir / match_id / "events.json"
    return _cached_request("fixtures/events", {"fixture": match_id}, cache_path)


def fetch_lineups(match_id: str) -> Dict[str, Any]:
    cache_path = settings.cache_dir / match_id / "lineups.json"
    return _cached_request("fixtures/lineups", {"fixture": match_id}, cache_path)


def fetch_stats(match_id: str) -> Dict[str, Any]:
    cache_path = settings.cache_dir / match_id / "stats.json"
    return _cached_request("fixtures/statistics", {"fixture": match_id}, cache_path)


def fetch_players(match_id: str) -> Dict[str, Any]:
    cache_path = settings.cache_dir / match_id / "players.json"
    return _cached_request("fixtures/players", {"fixture": match_id}, cache_path)
