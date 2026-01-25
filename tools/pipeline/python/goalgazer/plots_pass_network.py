from __future__ import annotations

from pathlib import Path
from collections import Counter
from typing import Tuple

import matplotlib.pyplot as plt
from mplsoccer import Pitch

from .schemas import MatchData, FigureMeta


def _compute_pass_links(match: MatchData, team_id: str) -> Tuple[Counter, Counter]:
    passes = [event for event in match.events if event.type == "Pass" and event.teamId == team_id and event.outcome == "Complete"]
    player_positions = {}
    player_counts = Counter()
    link_counts = Counter()

    for event in passes:
        player_counts[event.playerId] += 1
        if event.playerId not in player_positions:
            player_positions[event.playerId] = []
        player_positions[event.playerId].append((event.x, event.y))

    for i in range(len(passes) - 1):
        src = passes[i].playerId
        dst = passes[i + 1].playerId
        if src and dst and src != dst:
            link_counts[(src, dst)] += 1

    return player_counts, link_counts


def render_pass_network(match: MatchData, team_side: str, out_path: Path) -> FigureMeta:
    team = next(team for team in match.teams if team.side == team_side)
    player_counts, link_counts = _compute_pass_links(match, team.id)

    pitch = Pitch(pitch_type="statsbomb", pitch_color="#f8fafc", line_color="#1f2937")
    fig, ax = pitch.draw(figsize=(12, 8))

    players = [player for player in match.players if player.teamId == team.id]
    for player in players:
        events = [event for event in match.events if event.playerId == player.id]
        if not events:
            continue
        xs = [event.x for event in events]
        ys = [event.y for event in events]
        x_mean = sum(xs) / len(xs)
        y_mean = sum(ys) / len(ys)
        size = max(150, player_counts.get(player.id, 1) * 15)
        pitch.scatter(x_mean, y_mean, s=size, ax=ax, color="#2563eb", edgecolor="white", linewidth=1.5)
        ax.text(x_mean, y_mean, player.name.split(" ")[0], ha="center", va="center", fontsize=8, color="white")

    max_link = max(link_counts.values()) if link_counts else 1
    for (src, dst), count in link_counts.items():
        src_event = next((event for event in match.events if event.playerId == src), None)
        dst_event = next((event for event in match.events if event.playerId == dst), None)
        if not src_event or not dst_event:
            continue
        pitch.lines(
            src_event.x,
            src_event.y,
            dst_event.x,
            dst_event.y,
            ax=ax,
            color="#1f2937",
            lw=0.5 + (count / max_link) * 4,
            alpha=0.3 + (count / max_link) * 0.6,
        )

    ax.set_title(f"{match.match.homeTeam} vs {match.match.awayTeam} | {team.name} Pass Network", fontsize=12)
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200)
    plt.close(fig)

    return FigureMeta(
        src_relative=str(out_path).split("public")[1],
        alt=f"Pass network for {team.name} showing average positions and pass links.",
        caption=f"{team.name} pass network (successful passes).",
        width=1600,
        height=1000,
    )
