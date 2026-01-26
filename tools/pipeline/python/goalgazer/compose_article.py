from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from .schemas import MatchData, FigureMeta, LLMOutput


def derive_metrics(match: MatchData) -> Dict[str, Any]:
    metrics: Dict[str, Any] = {}
    
    # Use normalized stats if available
    if match.aggregates.normalized:
        for team_id, nstats in match.aggregates.normalized.items():
            side = "home" if team_id == str(next(t.id for t in match.teams if t.side == "home")) else "away"
            for k, v in nstats.items():
                metrics[f"{k}_{side}"] = v
                
    # Also add player-level stats to the pool for LLM evidence
    for player in match.players:
        p_prefix = f"player_{player.id}"
        metrics[f"{p_prefix}_rating"] = player.stats.rating
        metrics[f"{p_prefix}_goals"] = sum(1 for e in match.timeline if e.playerId == player.id and e.type == "goal")
        # Add more player stats as needed
        
    return metrics


def summarize_pass_network(match: MatchData) -> Dict[str, Any]:
    # Legacy wrapper or enhanced summary
    return {"status": "Complete"}


def summarize_shots(match: MatchData) -> Dict[str, Any]:
    return {"status": "Complete"}


def build_article_json(
    match: MatchData,
    llm_output: LLMOutput,
    figures: List[FigureMeta],
    data_citations: List[str],
) -> Dict[str, Any]:
    sections = []
    
    # Simple heuristic to distribute figures to sections
    # Overview -> 1, Moments -> 1, Tactical -> the rest
    figure_map = {
        0: [figures[5]] if len(figures) > 5 else [], # stats_comparison
        1: [figures[4]] if len(figures) > 4 else [], # goals_timeline
        2: [f for i, f in enumerate(figures) if i in [0, 1, 2, 3]] # Pass networks, shot map, heatmap
    }

    for i, section in enumerate(llm_output.sections):
        section_figures = figure_map.get(i, [])
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
        "timeline": [t.model_dump() for t in match.timeline],
        "normalized_stats": match.aggregates.normalized,
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
