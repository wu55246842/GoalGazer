from __future__ import annotations

from pathlib import Path
from typing import List
import math
import matplotlib.pyplot as plt
from mplsoccer import Pitch
from matplotlib.patches import Patch

from .schemas import MatchData, FigureMeta


def _shot_size(shot_x: float, shot_y: float) -> float:
    distance = math.hypot(100 - shot_x, 50 - shot_y)
    return max(80, 320 - distance * 3)


def render_shot_map(match: MatchData, out_path: Path) -> FigureMeta:
    # Professional grass green pitch
    pitch = Pitch(
        pitch_type="statsbomb", 
        pitch_color="#1e7a46",  # Professional grass green
        line_color="#ffffff",    # White lines
        linewidth=2
    )
    fig, ax = pitch.draw(figsize=(14, 10))

    shots = [event for event in match.events if event.type == "Shot"]
    
    # Enhanced color scheme for outcomes
    colors = {
        "Goal": "#fbbf24",      # Gold for goals
        "Miss": "#ef4444",      # Red for misses
        "Saved": "#3b82f6",     # Blue for saves
        "Blocked": "#f97316",   # Orange for blocks
        "Off Target": "#ef4444",
        "Woodwork": "#a855f7",  # Purple for hitting the post
    }

    for shot in shots:
        x = shot.x
        y = shot.y
        size = _shot_size(x, y)
        outcome = shot.outcome or "Unknown"
        
        pitch.scatter(
            x, y,
            s=size,
            ax=ax,
            color=colors.get(outcome, "#6b7280"),
            edgecolor="white",
            linewidth=2,
            alpha=0.85,
            zorder=2
        )

    # Enhanced title
    title = f"{match.match.homeTeam['name']} vs {match.match.awayTeam['name']}\nShot Map - All Attempts"
    ax.set_title(title, fontsize=14, fontweight="bold", color="#1e7a46", pad=20)
    
    # Add legend
    legend_elements = [
        Patch(facecolor=colors["Goal"], edgecolor='white', label='Goal'),
        Patch(facecolor=colors["Saved"], edgecolor='white', label='Saved'),
        Patch(facecolor=colors["Miss"], edgecolor='white', label='Miss/Off Target'),
        Patch(facecolor=colors["Blocked"], edgecolor='white', label='Blocked'),
    ]
    ax.legend(handles=legend_elements, loc='upper left', framealpha=0.9)
    
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200, facecolor='#1e7a46')
    plt.close(fig)

    return FigureMeta(
        id="shot_map",
        src_relative=str(out_path).split("public")[1].replace("\\", "/"),
        alt=f"Shot map for {match.match.homeTeam['name']} vs {match.match.awayTeam['name']} showing all shot attempts and outcomes.",
        caption="Shot map with outcomes: Gold (Goal), Blue (Saved), Red (Miss), Orange (Blocked). Size indicates distance to goal.",
        width=1600,
        height=1000,
        kind="other",
    )


def render_shot_proxy(match: MatchData, out_path: Path) -> FigureMeta:
    """Render a shot proxy chart when shot locations are unavailable."""
    home_team = next(t for t in match.teams if t.side == "home")
    away_team = next(t for t in match.teams if t.side == "away")

    h_stats = match.aggregates.normalized.get(home_team.id, {}) if match.aggregates.normalized else {}
    a_stats = match.aggregates.normalized.get(away_team.id, {}) if match.aggregates.normalized else {}

    labels = ["Total Shots", "Shots on Target"]
    home_vals = [h_stats.get("total_shots", 0) or 0, h_stats.get("shots_on_target", 0) or 0]
    away_vals = [a_stats.get("total_shots", 0) or 0, a_stats.get("shots_on_target", 0) or 0]

    x = range(len(labels))
    width = 0.35

    fig, ax = plt.subplots(figsize=(12, 8), facecolor="#1e7a46")
    ax.set_facecolor("#1e7a46")

    ax.bar([i - width / 2 for i in x], home_vals, width, label=home_team.name, color="#3b82f6", edgecolor="white")
    ax.bar([i + width / 2 for i in x], away_vals, width, label=away_team.name, color="#ef4444", edgecolor="white")

    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, color="white", fontsize=12, fontweight="bold")
    ax.tick_params(axis="y", colors="white")

    for spine in ax.spines.values():
        spine.set_color("white")

    ax.legend(framealpha=0.9)
    ax.set_title(
        f"Shot Proxy Comparison\n{home_team.name} vs {away_team.name}",
        fontsize=16,
        fontweight="bold",
        color="white",
        pad=20,
    )

    for idx, (home_val, away_val) in enumerate(zip(home_vals, away_vals)):
        ax.text(idx - width / 2, home_val + 0.5, str(home_val), color="white", ha="center", fontweight="bold")
        ax.text(idx + width / 2, away_val + 0.5, str(away_val), color="white", ha="center", fontweight="bold")

    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200, facecolor="#1e7a46")
    plt.close(fig)

    return FigureMeta(
        id="shot_proxy",
        src_relative=str(out_path).split("public")[1].replace("\\", "/"),
        alt=f"Shot proxy chart comparing {home_team.name} and {away_team.name} total shots and shots on target.",
        caption="Shot proxy chart based on team totals when shot locations are unavailable.",
        width=1200,
        height=800,
        kind="shot_proxy",
    )
