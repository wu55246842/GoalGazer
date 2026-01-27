from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from .schemas import (
    MatchData, MatchInfo, TeamInfo, PlayerInfo, PlayerStats, 
    Event, EventQualifier, Aggregates, TimelineEvent, TeamNormalizedStats
)


def load_mock_match(match_id: str) -> MatchData:
    mock_path = Path(__file__).parent / "mock_data" / f"match_{match_id}.json"
    data = json.loads(mock_path.read_text())
    return MatchData.model_validate(data)


def _normalize_team_stats(stats_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Convert API-Football stats to normalized format."""
    mapping = {
        "Ball Possession": "possession",
        "Total Shots": "total_shots",
        "Shots on Goal": "shots_on_target",
        "Corner Kicks": "corners",
        "Fouls": "fouls",
        "Yellow Cards": "yellow_cards",
        "Red Cards": "red_cards",
        "Offsides": "offsides",
        "Total passes": "passes_total",
        "Passes %": "pass_accuracy"
    }
    
    normalized = {}
    for team_data in stats_data.get("response", []):
        team_id = str(team_data["team"]["id"])
        stats_obj = {}
        for item in team_data.get("statistics", []):
            key = mapping.get(item["type"])
            if key:
                val = item["value"]
                if isinstance(val, str) and "%" in val:
                    val = int(val.replace("%", ""))
                stats_obj[key] = val
        normalized[team_id] = TeamNormalizedStats.model_validate(stats_obj).model_dump()
    return normalized


def _extract_timeline(events_data: Dict[str, Any]) -> list[TimelineEvent]:
    timeline = []
    
    for item in events_data.get("response", []):
        etype = item["type"].lower()
        if etype not in ["goal", "card", "subst", "var"]:
            etype = "other"

        timeline.append(
            TimelineEvent(
                minute=item["time"]["elapsed"] + (item["time"]["extra"] or 0),
                type=etype,
                teamId=str(item["team"]["id"]) if item.get("team") else None,
                teamName=item.get("team", {}).get("name") if item.get("team") else None,
                playerId=str(item["player"]["id"]) if item.get("player") and item["player"].get("id") else None,
                playerName=item.get("player", {}).get("name"),
                assistId=str(item["assist"]["id"]) if item.get("assist") and item["assist"].get("id") else None,
                assistName=item.get("assist", {}).get("name") if item.get("assist") else None,
                detail=item.get("detail"),
                score_after=None
            )
        )
    return sorted(timeline, key=lambda x: x.minute)


def _merge_detailed_players(players: list[PlayerInfo], players_data: Dict[str, Any]) -> list[PlayerInfo]:
    if not players_data or not players_data.get("response"):
        return players
        
    stats_map = {}
    minutes_map = {}
    for team_data in players_data["response"]:
        for p_data in team_data.get("players", []):
            p_id = str(p_data["player"]["id"])
            p_stats = p_data["statistics"][0] # Usually only one item per match
            
            stats_map[p_id] = PlayerStats(
                rating=p_stats.get("games", {}).get("rating"),
                shots=p_stats.get("shots", {}).get("total"),
                key_passes=p_stats.get("passes", {}).get("key"),
                passes_completed=p_stats.get("passes", {}).get("accuracy"), # This varies in API
                tackles=p_stats.get("tackles", {}).get("total"),
                interceptions=p_stats.get("tackles", {}).get("interceptions"),
                duels_total=p_stats.get("duels", {}).get("total"),
                duels_won=p_stats.get("duels", {}).get("won"),
                dribbles_success=p_stats.get("dribbles", {}).get("success")
            )
            minutes_map[p_id] = p_stats.get("games", {}).get("minutes", 0)
    
    for p in players:
        if p.id in stats_map:
            p.stats = stats_map[p.id]
            # Update minutes if detailed data is better
            detailed_mins = minutes_map.get(p.id, 0) or 0
            if detailed_mins > 0:
                p.minutes = detailed_mins
                
    return players


def normalize_api_payload(
    fixture: Dict[str, Any],
    events: Dict[str, Any],
    lineups: Dict[str, Any],
    stats: Dict[str, Any],
    players_detailed: Optional[Dict[str, Any]] = None
) -> MatchData:
    fixture_info = fixture["response"][0]
    fixture_meta = fixture_info["fixture"]
    league_meta = fixture_info["league"]
    teams_meta = fixture_info["teams"]

    home_score = fixture_info.get("goals", {}).get("home")
    away_score = fixture_info.get("goals", {}).get("away")
    score = {
        "home": 0 if home_score is None else home_score,
        "away": 0 if away_score is None else away_score,
    }
    ht_home = fixture_info.get("score", {}).get("halftime", {}).get("home")
    ht_away = fixture_info.get("score", {}).get("halftime", {}).get("away")
    if ht_home is not None:
        score["ht_home"] = ht_home
    if ht_away is not None:
        score["ht_away"] = ht_away

    match = MatchInfo(
        id=str(fixture_meta["id"]),
        date_utc=fixture_meta["date"],
        league=league_meta["name"],
        season=str(league_meta["season"]),
        round=league_meta.get("round"),
        homeTeam={"id": str(teams_meta["home"]["id"]), "name": teams_meta["home"]["name"]},
        awayTeam={"id": str(teams_meta["away"]["id"]), "name": teams_meta["away"]["name"]},
        score=score,
        venue=fixture_meta.get("venue", {}).get("name"),
    )

    teams = [
        TeamInfo(id=str(teams_meta["home"]["id"]), name=teams_meta["home"]["name"], side="home"),
        TeamInfo(id=str(teams_meta["away"]["id"]), name=teams_meta["away"]["name"], side="away"),
    ]

    base_players: list[PlayerInfo] = []
    for lineup in lineups.get("response", []):
        team_id = str(lineup["team"]["id"])
        # Add starters
        for player in lineup.get("startXI", []):
            player_info = player["player"]
            base_players.append(
                PlayerInfo(
                    id=str(player_info["id"]),
                    name=player_info["name"],
                    teamId=team_id,
                    position=player_info.get("pos", ""),
                    minutes=90,
                    stats=PlayerStats(),
                )
            )
        # Add substitutes
        for player in lineup.get("substitutes", []):
            player_info = player["player"]
            base_players.append(
                PlayerInfo(
                    id=str(player_info["id"]),
                    name=player_info["name"],
                    teamId=team_id,
                    position=player_info.get("pos", ""),
                    minutes=0,
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

    # Aggregates and Normalized Stats
    normalized_map = _normalize_team_stats(stats)
    
    aggregates = Aggregates(
        normalized=normalized_map,
        raw={str(t["team"]["id"]): t for t in stats.get("response", [])}
    )
    
    # Fill old legacy aggregates for backward compatibility if needed by plots
    for team_id, nstats in normalized_map.items():
        prefix = "home" if team_id == str(teams_meta["home"]["id"]) else "away"
        
        aggregates.possession = aggregates.possession or {}
        aggregates.possession[prefix] = nstats.get("possession")
        
        aggregates.shots = aggregates.shots or {}
        aggregates.shots[prefix] = nstats.get("total_shots")
        
        aggregates.shotsOnTarget = aggregates.shotsOnTarget or {}
        aggregates.shotsOnTarget[prefix] = nstats.get("shots_on_target")

    # Timeline
    timeline = _extract_timeline(events)
    
    # Merge detailed players
    final_players = _merge_detailed_players(base_players, players_detailed)

    return MatchData(
        match=match,
        teams=teams,
        players=final_players,
        events=event_items,
        timeline=timeline,
        aggregates=aggregates,
    )
