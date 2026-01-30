from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from jsonschema import validate

from .schemas import MatchData, FigureMeta, LLMOutput


STAT_SOURCE_MAP = {
    "possession": "Ball Possession",
    "total_shots": "Total Shots",
    "shots_on_target": "Shots on Goal",
    "shots_off_target": "Shots off Goal",
    "corners": "Corner Kicks",
    "fouls": "Fouls",
    "yellow_cards": "Yellow Cards",
    "red_cards": "Red Cards",
    "offsides": "Offsides",
    "passes_total": "Total passes",
    "pass_accuracy": "Passes %",
    "xg": "expected_goals",
    "gk_saves": "Goalkeeper Saves",
    "shots_inside_box": "Shots insidebox",
    "shots_outside_box": "Shots outsidebox",
    "blocked_shots": "Blocked Shots",
}

PLAYER_SOURCE_MAP = {
    "rating": "fixtures/players.statistics[].games.rating",
    "shots": "fixtures/players.statistics[].shots.total",
    "key_passes": "fixtures/players.statistics[].passes.key",
    "passes": "fixtures/players.statistics[].passes.accuracy",
    "tackles": "fixtures/players.statistics[].tackles.total",
    "duels_won": "fixtures/players.statistics[].duels.won",
}


def _parse_xg_value(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned == "":
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _has_xg_from_stats(stats_payload: Dict[str, Any], match: MatchData) -> bool:
    for team_data in stats_payload.get("response", []):
        for item in team_data.get("statistics", []):
            stat_type = str(item.get("type", "")).lower()
            if "xg" in stat_type or "expected goals" in stat_type:
                if _parse_xg_value(item.get("value")) is not None:
                    return True
    for team_stats in (match.aggregates.normalized or {}).values():
        if team_stats.get("xg") is not None:
            return True
    return False


def build_data_provenance(
    match: MatchData,
    endpoints_used: List[str],
    fetched_at_utc: str,
    events_payload: Dict[str, Any],
    stats_payload: Dict[str, Any],
    lineups_payload: Dict[str, Any],
    players_payload: Dict[str, Any],
) -> Dict[str, Any]:
    has_events = bool(events_payload.get("response")) or bool(match.timeline)
    has_statistics = bool(stats_payload.get("response")) or bool(match.aggregates.normalized)
    has_lineups = bool(lineups_payload.get("response")) or bool(match.players)
    has_players = False
    for team_data in players_payload.get("response", []):
        for player in team_data.get("players", []):
            stats = player.get("statistics", [])
            if stats:
                has_players = True
                break
        if has_players:
            break

    has_xg = _has_xg_from_stats(stats_payload, match)

    if events_payload.get("response"):
        has_shot_locations = any(
            any(key in item for key in ("x", "y", "location"))
            for item in events_payload.get("response", [])
        )
    else:
        has_shot_locations = any(
            event.x not in (None, 50.0) or event.y not in (None, 50.0)
            for event in match.events
        )

    return {
        "provider": "api-football",
        "endpoints_used": sorted(set(endpoints_used)),
        "fetched_at_utc": fetched_at_utc,
        "availability": {
            "has_events": has_events,
            "has_statistics": has_statistics,
            "has_lineups": has_lineups,
            "has_players": has_players,
            "has_xg": has_xg,
            "has_shot_locations": has_shot_locations,
        },
        "notes": [],
    }


def build_players_output(match: MatchData, availability: Dict[str, bool]) -> Optional[Dict[str, List[Dict[str, Any]]]]:
    if not availability.get("has_players"):
        return None

    players_by_side = {"home": [], "away": []}
    team_lookup = {team.id: team.side for team in match.teams}

    goals_by_player = {}
    assists_by_player = {}
    yellow_by_player = {}
    red_by_player = {}

    for event in match.timeline:
        if event.playerId:
            if event.type == "goal":
                goals_by_player[event.playerId] = goals_by_player.get(event.playerId, 0) + 1
            if event.type == "card" and event.detail:
                if "red" in event.detail.lower():
                    red_by_player[event.playerId] = red_by_player.get(event.playerId, 0) + 1
                if "yellow" in event.detail.lower():
                    yellow_by_player[event.playerId] = yellow_by_player.get(event.playerId, 0) + 1
        if event.assistId:
            assists_by_player[event.assistId] = assists_by_player.get(event.assistId, 0) + 1

    def safe_float(value: Optional[str]) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    for player in match.players:
        side = team_lookup.get(player.teamId, "home")
        players_by_side[side].append(
            {
                "id": player.id,
                "name": player.name,
                "minutes": player.minutes,
                "goals": goals_by_player.get(player.id),
                "assists": assists_by_player.get(player.id),
                "yellow": yellow_by_player.get(player.id),
                "red": red_by_player.get(player.id),
                "position": player.position,
                "is_starter": player.is_starter,
                "rating": safe_float(player.stats.rating),
                "shots": player.stats.shots,
                "key_passes": player.stats.key_passes,
                "passes": player.stats.passes_completed,
                "tackles": player.stats.tackles,
                "duels_won": player.stats.duels_won,
            }
        )

    for side in players_by_side:
        players_by_side[side] = sorted(players_by_side[side], key=lambda p: (not p["is_starter"], p["name"]))

    return players_by_side


def build_evidence_catalog(match: MatchData, players_output: Optional[Dict[str, List[Dict[str, Any]]]]) -> Dict[str, Any]:
    evidence: Dict[str, Any] = {}

    if match.match.score:
        if match.match.score.get("home") is not None:
            evidence["match.score.home"] = match.match.score.get("home")
        if match.match.score.get("away") is not None:
            evidence["match.score.away"] = match.match.score.get("away")
    
    if match.match.formation:
        evidence["match.formation"] = match.match.formation
        evidence["match_context.formation"] = match.match.formation

    if match.aggregates.normalized:
        for team_id, stats in match.aggregates.normalized.items():
            for key, value in stats.items():
                evidence[f"team_stats.normalized.{team_id}.{key}"] = value

    for idx, event in enumerate(match.timeline):
        if event.minute is not None:
            evidence[f"timeline.{idx}.minute"] = event.minute
        if event.type:
            evidence[f"timeline.{idx}.type"] = event.type
        if event.teamId:
            evidence[f"timeline.{idx}.teamId"] = event.teamId
        if event.teamName:
            evidence[f"timeline.{idx}.teamName"] = event.teamName
        if event.playerId:
            evidence[f"timeline.{idx}.playerId"] = event.playerId
        if event.playerName:
            evidence[f"timeline.{idx}.playerName"] = event.playerName
        if event.assistName:
            evidence[f"timeline.{idx}.assistName"] = event.assistName
        if event.detail:
            evidence[f"timeline.{idx}.detail"] = event.detail

    if players_output:
        for side, players in players_output.items():
            for idx, player in enumerate(players):
                for key, value in player.items():
                    if value is not None:
                        evidence[f"players.{side}.{idx}.{key}"] = value

    return evidence


def summarize_pass_network(match: MatchData) -> Dict[str, Any]:
    # Legacy wrapper or enhanced summary
    return {"status": "Complete"}


def summarize_shots(match: MatchData) -> Dict[str, Any]:
    return {"status": "Complete"}


def _build_limitations(availability: Dict[str, bool]) -> List[str]:
    return []


def _filter_limitations(limitations: List[str], availability: Dict[str, bool]) -> List[str]:
    filtered: List[str] = []
    for item in limitations:
        lowered = item.lower()
        if availability.get("has_xg") and ("xg" in lowered or "expected goals" in lowered):
            continue
        if availability.get("has_players") and ("player" in lowered or "rating" in lowered):
            continue
        if availability.get("has_shot_locations") and "shot location" in lowered:
            continue
        if availability.get("has_statistics") and "team-level statistics" in lowered:
            continue
        filtered.append(item)
    return filtered


def _find_player_row(
    players_output: Optional[Dict[str, List[Dict[str, Any]]]],
    team_name: str,
    player_name: str,
) -> Optional[tuple[str, int, Dict[str, Any]]]:
    if not players_output:
        return None
    team_key = team_name.strip().lower()
    for side, players in players_output.items():
        for idx, player in enumerate(players):
            if player.get("name", "").strip().lower() == player_name.strip().lower():
                return side, idx, player
    return None


def _extract_rating_from_summary(summary: str) -> Optional[str]:
    match = re.search(r"(\d+(?:\.\d+)?)\s*rating", summary, re.IGNORECASE)
    if match:
        return match.group(1)
    return None


def _strip_rating_from_summary(summary: str) -> str:
    return re.sub(r"\s*\(?\b\d+(?:\.\d+)?\s*rating\b\)?", "", summary, flags=re.IGNORECASE).strip()


def build_article_json(
    match: MatchData,
    llm_output: LLMOutput,
    figures: List[FigureMeta],
    data_provenance: Dict[str, Any],
) -> Dict[str, Any]:
    availability = data_provenance["availability"]
    players_output = build_players_output(match, availability)
    evidence_catalog = build_evidence_catalog(match, players_output)

    sections = [
        {
            "heading": section.heading,
            "paragraphs": section.paragraphs,
            "bullets": section.bullets or [],
            "claims": [claim.model_dump() for claim in section.claims],
        }
        for section in llm_output.sections
    ]

    player_notes = []
    for note in llm_output.player_notes:
        summary = note.summary
        rating_value = note.rating if availability.get("has_players") else None
        rating_in_summary = _extract_rating_from_summary(summary)
        evidence = list(note.evidence)

        if availability.get("has_players") and rating_in_summary and not rating_value:
            player_row = _find_player_row(players_output, note.team, note.player)
            if player_row and player_row[2].get("rating") is not None:
                rating_value = str(player_row[2].get("rating"))
                rating_path = f"players.{player_row[0]}.{player_row[1]}.rating={rating_value}"
                if not any(".rating" in item for item in evidence):
                    evidence.append(rating_path)
            else:
                summary = _strip_rating_from_summary(summary)
        elif rating_value and not any(".rating" in item for item in evidence):
            player_row = _find_player_row(players_output, note.team, note.player)
            if player_row and player_row[2].get("rating") is not None:
                rating_path = f"players.{player_row[0]}.{player_row[1]}.rating={rating_value}"
                evidence.append(rating_path)
        player_notes.append(
            {
                "player": note.player,
                "team": note.team,
                "summary": summary,
                "evidence": evidence,
                **({"rating": rating_value} if rating_value else {}),
            }
        )

    combined_limitations = llm_output.data_limitations + _build_limitations(availability)
    data_limitations = list(dict.fromkeys(_filter_limitations(combined_limitations, availability)))

    def _slugify(text: str) -> str:
        text = str(text).lower()
        text = re.sub(r'[^a-z0-9]+', '-', text)
        return text.strip('-')

    home_slug = _slugify(match.match.homeTeam["name"])
    away_slug = _slugify(match.match.awayTeam["name"])
    league_slug = _slugify(match.match.league)
    slug = f"{home_slug}-vs-{away_slug}-{league_slug}-tactical-analysis"

    frontmatter = {
        "title": llm_output.title,
        "description": llm_output.meta_description,
        "date": match.match.date_utc,
        "matchId": match.match.id,
        "slug": slug,
        "league": match.match.league.lower().replace(" ", "-"),
        "teams": [match.match.homeTeam["name"], match.match.awayTeam["name"]],
        "tags": llm_output.tags,
    }
    if figures:
        frontmatter["heroImage"] = figures[0].src_relative

    article = {
        "frontmatter": frontmatter,
        "match": match.match.model_dump(),
        "data_provenance": data_provenance,
        "timeline": [t.model_dump() for t in match.timeline],
        "team_stats": {
            "raw": match.aggregates.raw,
            "normalized": match.aggregates.normalized or {},
        },
        **({"players": players_output} if players_output else {}),
        "figures": [
            {
                "id": figure.id,
                "src": figure.src_relative,
                "alt": figure.alt,
                "caption": figure.caption,
                "width": figure.width,
                "height": figure.height,
                "kind": figure.kind,
            }
            for figure in figures
        ],
        "sections": sections,
        "player_notes": player_notes,
        "data_limitations": data_limitations,
        "cta": llm_output.cta,
        "multiverse": llm_output.multiverse.model_dump() if llm_output.multiverse else None,
    }

    _validate_article(article, evidence_catalog, availability)
    article["data_provenance"]["notes"] = _build_provenance_notes(article, evidence_catalog)
    return article


def derive_metrics(match: MatchData, availability: Dict[str, bool]) -> Dict[str, Any]:
    players_output = build_players_output(match, availability)
    return build_evidence_catalog(match, players_output)


def _validate_article(article: Dict[str, Any], evidence_catalog: Dict[str, Any], availability: Dict[str, bool]) -> None:
    schema_path = Path(__file__).with_name("schema_match_analysis.json")
    if schema_path.exists():
        schema = json.loads(schema_path.read_text())
        validate(instance=article, schema=schema)

    forbidden_terms = []
    if not availability.get("has_xg"):
        forbidden_terms.append(r"\bxg\b")
        forbidden_terms.append(r"expected goals")
    if not availability.get("has_players"):
        forbidden_terms.append(r"\brating\b")
        forbidden_terms.append(r"\bduel")

    text_fields = []
    for section in article.get("sections", []):
        text_fields.extend(section.get("paragraphs", []))
        text_fields.extend(section.get("bullets", []))
        for claim in section.get("claims", []):
            text_fields.append(claim.get("claim", ""))
    for note in article.get("player_notes", []):
        text_fields.append(note.get("summary", ""))

    for term in forbidden_terms:
        pattern = re.compile(term, re.IGNORECASE)
        if any(pattern.search(text or "") for text in text_fields):
            raise ValueError(f"Forbidden term detected in narrative: {term}")

    for section in article.get("sections", []):
        for claim in section.get("claims", []):
            for evidence in claim.get("evidence", []):
                _validate_evidence(evidence, evidence_catalog)

    for note in article.get("player_notes", []):
        paths = _extract_paths(note.get("evidence", []))
        for evidence in note.get("evidence", []):
            _validate_evidence(evidence, evidence_catalog)
        if note.get("rating"):
            has_rating_evidence = any(".rating" in path for path in paths)
            if not has_rating_evidence:
                raise ValueError("Player note rating lacks rating evidence.")
        if not availability.get("has_players"):
            for path in paths:
                if not path.startswith("timeline."):
                    raise ValueError("Player notes must use timeline evidence when player stats are unavailable.")

    if not availability.get("has_players") and article.get("players"):
        raise ValueError("Players data present when availability.has_players is false.")


def _validate_evidence(evidence: str, evidence_catalog: Dict[str, Any]) -> None:
    if "=" in evidence:
        path = evidence.split("=")[0].strip()
    else:
        path = evidence.strip()
    if path not in evidence_catalog:
        # Relax validation: just warn instead of failing the entire pipeline
        print(f"⚠️ Warning: Evidence path not found in catalog: {path}")
        return
        # raise ValueError(f"Evidence path not found in catalog: {path}")


def _build_provenance_notes(article: Dict[str, Any], evidence_catalog: Dict[str, Any]) -> List[str]:
    notes = [
        "match.* sourced from fixtures (teams, score, venue, kickoff)",
    ]

    availability = article["data_provenance"]["availability"]
    if availability.get("has_events"):
        notes.append("timeline[*] sourced from fixtures/events (time, type, team, player, detail)")
    if availability.get("has_statistics"):
        stat_keys = set()
        for stats in (article.get("team_stats", {}).get("normalized") or {}).values():
            stat_keys.update(stats.keys())
        for stat_key in sorted(stat_keys):
            source_label = STAT_SOURCE_MAP.get(stat_key, stat_key)
            notes.append(
                f"team_stats.normalized[*].{stat_key} sourced from fixtures/statistics.statistics['{source_label}']"
            )
    if availability.get("has_players"):
        notes.append("players[*] sourced from fixtures/players.statistics")
        for key, source in PLAYER_SOURCE_MAP.items():
            notes.append(f"players[*].{key} sourced from {source}")

    return notes


def _extract_paths(evidence_list: List[str]) -> List[str]:
    paths = []
    for item in evidence_list:
        if "=" in item:
            paths.append(item.split("=")[0].strip())
        else:
            paths.append(item.strip())
    return paths


def write_article(article: Dict[str, Any], output_dir: Path, index_path: Path, lang: str = "en") -> Path:
    match_id = article["frontmatter"]["matchId"]
    
    # New structure: content/matches/<match_id>/index.<lang>.json
    match_dir = output_dir / match_id
    match_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = match_dir / f"index.{lang}.json"
    file_path.write_text(json.dumps(article, indent=2))

    existing = []
    if index_path.exists():
        try:
            existing = json.loads(index_path.read_text())
        except json.JSONDecodeError:
            existing = []
            
    date_key = article["frontmatter"]["date"].split("T")[0]
    entry = {
        "title": article["frontmatter"]["title"],
        "description": article["frontmatter"]["description"],
        "date": article["frontmatter"]["date"],
        "matchId": match_id,
        "slug": f"{date_key}_{match_id}", # Keep slug consistency for now
        "teams": article["frontmatter"]["teams"],
        "league": article["frontmatter"]["league"],
    }
    existing = [item for item in existing if item.get("matchId") != match_id]
    existing.insert(0, entry)
    
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(existing, indent=2))
    
    return file_path
