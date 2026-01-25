from __future__ import annotations

from pathlib import Path
import matplotlib.pyplot as plt
from mplsoccer import Pitch
import numpy as np

from .schemas import MatchData, FigureMeta


def render_touch_heatmap(match: MatchData, team_side: str, out_path: Path) -> FigureMeta:
    team = next(team for team in match.teams if team.side == team_side)
    pitch = Pitch(pitch_type="statsbomb", pitch_color="#f8fafc", line_color="#1f2937")
    fig, ax = pitch.draw(figsize=(12, 8))

    events = [event for event in match.events if event.teamId == team.id]
    xs = np.array([event.x for event in events])
    ys = np.array([event.y for event in events])

    if len(xs) > 1:
        pitch.kdeplot(xs, ys, ax=ax, cmap="Reds", fill=True, alpha=0.6, levels=20)

    ax.set_title(f"{team.name} Touch Heatmap", fontsize=12)
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200)
    plt.close(fig)

    return FigureMeta(
        src_relative=str(out_path).split("public")[1],
        alt=f"Touch heatmap for {team.name}.",
        caption=f"Touch heatmap for {team.name} across all events.",
        width=1600,
        height=1000,
    )
