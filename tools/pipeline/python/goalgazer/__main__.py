from __future__ import annotations

import argparse
from pathlib import Path

from .config import settings
from .fetch_api_football import fetch_events, fetch_fixture, fetch_lineups, fetch_stats, fetch_players
from .normalize import load_mock_match, normalize_api_payload
from .plots_pass_network import render_pass_network
from .plots_shot_map import render_shot_map
from .plots_heatmap import render_touch_heatmap
from .plots_timeline import render_match_timeline
from .plots_stats import render_stats_comparison
from .compose_article import build_article_json, derive_metrics, summarize_pass_network, summarize_shots, write_article
from .llm_generate import generate_llm_output


def run_pipeline(match_id: str, league: str) -> None:
    if settings.api_football_key:
        fixture = fetch_fixture(match_id)
        events = fetch_events(match_id)
        lineups = fetch_lineups(match_id)
        stats = fetch_stats(match_id)
        players_detailed = fetch_players(match_id)
        match = normalize_api_payload(fixture, events, lineups, stats, players_detailed)
    else:
        match = load_mock_match(match_id)

    match_public_dir = settings.web_public_dir / match_id
    figures = []
    figures.append(render_pass_network(match, "home", match_public_dir / "pass_network_home.png"))
    figures.append(render_pass_network(match, "away", match_public_dir / "pass_network_away.png"))
    figures.append(render_shot_map(match, match_public_dir / "shot_map.png"))
    figures.append(render_touch_heatmap(match, "home", match_public_dir / "touch_heatmap_home.png"))
    figures.append(render_match_timeline(match, match_public_dir / "goals_timeline.png"))
    figures.append(render_stats_comparison(match, match_public_dir / "stats_comparison.png"))

    metrics = derive_metrics(match)
    figure_summaries = {
        "pass_network": summarize_pass_network(match),
        "shot_map": summarize_shots(match),
    }

    llm_output = generate_llm_output(match, metrics, figure_summaries)

    article = build_article_json(
        match=match,
        llm_output=llm_output,
        figures=figures,
        data_citations=["API-Football fixtures", "API-Football events"],
    )

    article_path = write_article(
        article,
        settings.web_content_dir / "matches",
        settings.web_content_dir / "index.json",
    )

    print("Generated article:", article_path)
    print("Generated figures:", [figure.src_relative for figure in figures])


def main() -> None:
    parser = argparse.ArgumentParser(description="Run GoalGazer content pipeline")
    parser.add_argument("--matchId", required=True)
    parser.add_argument("--mode", default="single")
    parser.add_argument("--league", default="epl")
    parser.add_argument("--date", default="")
    args = parser.parse_args()

    run_pipeline(match_id=args.matchId, league=args.league)


if __name__ == "__main__":
    main()
