from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from .schemas import MatchData, MatchInfo, TeamInfo, PlayerInfo, PlayerStats, Event, EventQualifier, Aggregates


def load_mock_match(match_id: str) -> MatchData:
    mock_path = Path(__file__).parent / "mock_data" / f"match_{match_id}.json"
    data = json.loads(mock_path.read_text())
    return MatchData.model_validate(data)


def normalize_api_payload(
    fixture: Dict[str, Any],
    events: Dict[str, Any],
    lineups: Dict[str, Any],
    stats: Dict[str, Any],
) -> MatchData:
    fixture_info = fixture["response"][0]
    fixture_meta = fixture_info["fixture"]
    league_meta = fixture_info["league"]
    teams_meta = fixture_info["teams"]

    match = MatchInfo(
        id=str(fixture_meta["id"]),
        date_utc=fixture_meta["date"],
        league=league_meta["name"],
        season=str(league_meta["season"]),
        round=league_meta.get("round", ""),
        homeTeam=teams_meta["home"]["name"],
        awayTeam=teams_meta["away"]["name"],
        score=f"{fixture_info['goals']['home']}-{fixture_info['goals']['away']}",
        venue=fixture_meta["venue"]["name"],
    )

    teams = [
        TeamInfo(id=str(teams_meta["home"]["id"]), name=teams_meta["home"]["name"], side="home"),
        TeamInfo(id=str(teams_meta["away"]["id"]), name=teams_meta["away"]["name"], side="away"),
    ]

    players: list[PlayerInfo] = []
    for lineup in lineups.get("response", []):
        team_id = str(lineup["team"]["id"])
        for player in lineup.get("startXI", []):
            player_info = player["player"]
            players.append(
                PlayerInfo(
                    id=str(player_info["id"]),
                    name=player_info["name"],
                    teamId=team_id,
                    position=player_info.get("pos", ""),
                    minutes=90,
                    stats=PlayerStats(),
                )
            )

    event_items: list[Event] = []
    for item in events.get("response", []):
        event_items.append(
            Event(
                type=item.get("type", ""),
                teamId=str(item["team"]["id"]),
                playerId=str(item["player"]["id"]) if item.get("player") else None,
                minute=item.get("time", {}).get("elapsed", 0),
                second=item.get("time", {}).get("extra", 0) or 0,
                x=50.0,
                y=50.0,
                endX=None,
                endY=None,
                outcome=item.get("detail"),
                qualifiers=EventQualifier(),
            )
        )

    aggregates = Aggregates()
    for team_stats in stats.get("response", []):
        if team_stats["team"]["id"] == teams_meta["home"]["id"]:
            prefix = "home"
        else:
            prefix = "away"
        for stat in team_stats.get("statistics", []):
            if stat["type"] == "Ball Possession":
                aggregates.possession = aggregates.possession or {}
                aggregates.possession[prefix] = int(str(stat["value"]).replace("%", ""))
            if stat["type"] == "Total Shots":
                aggregates.shots = aggregates.shots or {}
                aggregates.shots[prefix] = stat["value"]
            if stat["type"] == "Shots on Goal":
                aggregates.shotsOnTarget = aggregates.shotsOnTarget or {}
                aggregates.shotsOnTarget[prefix] = stat["value"]

    return MatchData(
        match=match,
        teams=teams,
        players=players,
        events=event_items,
        aggregates=aggregates,
    )
