from __future__ import annotations

from pathlib import Path
from typing import List
import math
import matplotlib.pyplot as plt
from mplsoccer import Pitch

from .schemas import MatchData, FigureMeta


def _shot_size(shot_x: float, shot_y: float) -> float:
    distance = math.hypot(100 - shot_x, 50 - shot_y)
    return max(80, 320 - distance * 3)


def render_shot_map(match: MatchData, out_path: Path) -> FigureMeta:
    pitch = Pitch(pitch_type="statsbomb", pitch_color="#f8fafc", line_color="#1f2937")
    fig, ax = pitch.draw(figsize=(12, 8))

    shots = [event for event in match.events if event.type == "Shot"]
    colors = {
        "Goal": "#16a34a",
        "Miss": "#dc2626",
        "Saved": "#2563eb",
        "Blocked": "#f97316",
    }

    for shot in shots:
        x = shot.x
        y = shot.y
        size = _shot_size(x, y)
        pitch.scatter(
            x,
            y,
            s=size,
            ax=ax,
            color=colors.get(shot.outcome, "#6b7280"),
            edgecolor="white",
            linewidth=1,
            alpha=0.85,
        )

    ax.set_title(
        f"{match.match.homeTeam} vs {match.match.awayTeam} | Shot Map",
        fontsize=12,
    )
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200)
    plt.close(fig)

    return FigureMeta(
        src_relative=str(out_path).split("public")[1],
        alt=f"Shot map for {match.match.homeTeam} vs {match.match.awayTeam}.",
        caption="Shot map with outcomes color-coded.",
        width=1600,
        height=1000,
    )
