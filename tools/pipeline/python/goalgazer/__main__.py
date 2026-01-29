from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone

if __package__ in (None, ""):
    package_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if package_root not in sys.path:
        sys.path.insert(0, package_root)
    from goalgazer.config import settings
    from goalgazer.fetch_api_football import (
        fetch_events,
        fetch_fixture,
        fetch_lineups,
        fetch_stats,
        fetch_players,
    )
    from goalgazer.normalize import load_mock_match, normalize_api_payload
    from goalgazer.plots_pass_network import render_pass_network
    from goalgazer.plots_shot_map import render_shot_map, render_shot_proxy
    from goalgazer.plots_heatmap import render_touch_heatmap
    from goalgazer.plots_timeline import render_match_timeline
    from goalgazer.plots_stats import render_stats_comparison
    from goalgazer.compose_article import (
        build_article_json,
        derive_metrics,
        summarize_pass_network,
        summarize_shots,
        write_article,
        build_data_provenance,
    )
    from goalgazer.llm_generate import generate_llm_output
else:
    from .config import settings
    from .fetch_api_football import fetch_events, fetch_fixture, fetch_lineups, fetch_stats, fetch_players
    from .normalize import load_mock_match, normalize_api_payload
    from .plots_pass_network import render_pass_network
    from .plots_shot_map import render_shot_map, render_shot_proxy
    from .plots_heatmap import render_touch_heatmap
    from .plots_timeline import render_match_timeline
    from .plots_stats import render_stats_comparison
    from .compose_article import (
        build_article_json,
        derive_metrics,
        summarize_pass_network,
        summarize_shots,
        write_article,
        build_data_provenance,
    )
    from .llm_generate import generate_llm_output


def run_pipeline(match_id: str, league: str) -> None:
    endpoints_used = ["fixtures"]
    fetched_at_utc = datetime.now(timezone.utc).isoformat()
    if settings.api_football_key:
        fixture = fetch_fixture(match_id)
        events = fetch_events(match_id)
        lineups = fetch_lineups(match_id)
        stats = fetch_stats(match_id)
        players_detailed = fetch_players(match_id)
        match = normalize_api_payload(fixture, events, lineups, stats, players_detailed)
        endpoints_used.extend(
            [
                endpoint
                for endpoint, payload in [
                    ("fixtures/events", events),
                    ("fixtures/statistics", stats),
                    ("fixtures/lineups", lineups),
                    ("fixtures/players", players_detailed),
                ]
                if payload and payload.get("response")
            ]
        )
    else:
        match = load_mock_match(match_id)
        fixture = {}
        events = {}
        lineups = {}
        stats = {}
        players_detailed = {}

    data_provenance = build_data_provenance(
        match=match,
        endpoints_used=endpoints_used,
        fetched_at_utc=fetched_at_utc,
        events_payload=events,
        stats_payload=stats,
        lineups_payload=lineups,
        players_payload=players_detailed,
    )

    match_public_dir = settings.web_public_dir / match_id
    figures = []
    if data_provenance["availability"]["has_shot_locations"]:
        figures.append(render_pass_network(match, "home", match_public_dir / "pass_network_home.png"))
        figures.append(render_pass_network(match, "away", match_public_dir / "pass_network_away.png"))
        figures.append(render_shot_map(match, match_public_dir / "shot_map.png"))
        figures.append(render_touch_heatmap(match, "home", match_public_dir / "touch_heatmap_home.png"))
    else:
        figures.append(render_shot_proxy(match, match_public_dir / "shot_proxy.png"))
    figures.append(render_match_timeline(match, match_public_dir / "goals_timeline.png"))
    figures.append(render_stats_comparison(match, match_public_dir / "stats_comparison.png"))

    metrics = derive_metrics(match, data_provenance["availability"])
    figure_summaries = {
        "pass_network": summarize_pass_network(match),
        "shot_map": summarize_shots(match),
    }

    llm_output = generate_llm_output(match, metrics, figure_summaries, data_provenance["availability"])

    article = build_article_json(
        match=match,
        llm_output=llm_output,
        figures=figures,
        data_provenance=data_provenance,
    )

    # article_path = write_article(
    #     article,
    #     settings.web_content_dir / "matches",
    #     settings.web_content_dir / "index.json",
    #     lang="en"
    # )

    # Output to stdout for Node ingestion
    print(json.dumps(article))
    # print("Generated article:", article_path)
    # print("Generated figures:", [figure.src_relative for figure in figures])


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
