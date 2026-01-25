from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from .schemas import MatchData, FigureMeta, LLMOutput


def derive_metrics(match: MatchData) -> Dict[str, Any]:
    metrics: Dict[str, Any] = {}
    if match.aggregates.possession:
        metrics["possession_home"] = match.aggregates.possession.get("home")
        metrics["possession_away"] = match.aggregates.possession.get("away")
    if match.aggregates.shots:
        metrics["shots_home"] = match.aggregates.shots.get("home")
        metrics["shots_away"] = match.aggregates.shots.get("away")
    if match.aggregates.passing:
        metrics["passes_completed"] = match.aggregates.passing.get("home_completed")
    return metrics


def summarize_pass_network(match: MatchData) -> Dict[str, Any]:
    pass_events = [event for event in match.events if event.type == "Pass" and event.outcome == "Complete"]
    top_pairs = []
    for i in range(len(pass_events) - 1):
        src = pass_events[i].playerId
        dst = pass_events[i + 1].playerId
        if src and dst and src != dst:
            top_pairs.append(f"{src}->{dst}")
    return {
        "top_pass_pairs": top_pairs[:5],
        "pass_network_dense_in_zone_14": bool(pass_events),
    }


def summarize_shots(match: MatchData) -> Dict[str, Any]:
    shots = [event for event in match.events if event.type == "Shot"]
    inside_box = [shot for shot in shots if shot.x >= 83 and 21 <= shot.y <= 79]
    goals = [shot for shot in shots if shot.outcome == "Goal"]
    return {
        "shot_count": len(shots),
        "shots_inside_box": len(inside_box),
        "goals": len(goals),
    }


def build_article_json(
    match: MatchData,
    llm_output: LLMOutput,
    figures: List[FigureMeta],
    data_citations: List[str],
) -> Dict[str, Any]:
    sections = []
    for section in llm_output.sections:
        section_figures = figures[:1] if section.heading == llm_output.sections[0].heading else figures[1:]
        sections.append(
            {
                "heading": section.heading,
                "paragraphs": section.paragraphs,
                "bullets": section.bullets,
                "figures": [
                    {
                        "src": figure.src_relative,
                        "alt": figure.alt,
                        "caption": figure.caption,
                        "width": figure.width,
                        "height": figure.height,
                    }
                    for figure in section_figures
                ],
                "claims": [claim.model_dump() for claim in section.claims],
            }
        )

    return {
        "frontmatter": {
            "title": llm_output.title,
            "description": llm_output.meta_description,
            "date": match.match.date_utc,
            "matchId": match.match.id,
            "league": match.match.league.lower().replace(" ", "-"),
            "teams": [match.match.homeTeam, match.match.awayTeam],
            "tags": llm_output.tags,
            "heroImage": figures[0].src_relative if figures else None,
        },
        "match": match.match.model_dump(),
        "sections": sections,
        "player_notes": [note.model_dump() for note in llm_output.player_notes],
        "data_limitations": llm_output.data_limitations,
        "data_citations": data_citations,
        "cta": llm_output.cta,
    }


def write_article(article: Dict[str, Any], output_dir: Path, index_path: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    date_key = article["frontmatter"]["date"].split("T")[0]
    match_id = article["frontmatter"]["matchId"]
    file_path = output_dir / f"{date_key}_{match_id}.json"
    file_path.write_text(json.dumps(article, indent=2))

    existing = []
    if index_path.exists():
        existing = json.loads(index_path.read_text())
    entry = {
        "title": article["frontmatter"]["title"],
        "description": article["frontmatter"]["description"],
        "date": article["frontmatter"]["date"],
        "matchId": match_id,
        "slug": f"{date_key}_{match_id}",
        "teams": article["frontmatter"]["teams"],
        "league": article["frontmatter"]["league"],
    }
    existing = [item for item in existing if item.get("matchId") != match_id]
    existing.insert(0, entry)
    index_path.write_text(json.dumps(existing, indent=2))
    return file_path
