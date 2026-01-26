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
    title = f"{match.match.homeTeam} vs {match.match.awayTeam}\nShot Map - All Attempts"
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
        src_relative=str(out_path).split("public")[1].replace("\\", "/"),
        alt=f"Shot map for {match.match.homeTeam} vs {match.match.awayTeam} showing all shot attempts and outcomes.",
        caption="Shot map with outcomes: Gold (Goal), Blue (Saved), Red (Miss), Orange (Blocked). Size indicates distance to goal.",
        width=1600,
        height=1000,
    )
