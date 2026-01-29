from __future__ import annotations

import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
from .schemas import MatchData, FigureMeta
from .figure_paths import build_src_relative

def render_stats_comparison(match: MatchData, out_path: Path) -> FigureMeta:
    """Render a bar chart comparing key team statistics."""
    # Data preparation
    home_team = next(t for t in match.teams if t.side == "home")
    away_team = next(t for t in match.teams if t.side == "away")
    
    h_stats = match.aggregates.normalized.get(home_team.id, {})
    a_stats = match.aggregates.normalized.get(away_team.id, {})
    
    metrics = [
        ("Possession (%)", "possession"),
        ("Total Shots", "total_shots"),
        ("Shots on Target", "shots_on_target"),
        ("Pass Accuracy (%)", "pass_accuracy"),
        ("Corners", "corners"),
        ("Fouls", "fouls")
    ]
    
    labels = [m[0] for m in metrics]
    home_vals = [h_stats.get(m[1], 0) or 0 for m in metrics]
    away_vals = [a_stats.get(m[1], 0) or 0 for m in metrics]
    
    y = np.arange(len(labels))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(14, 10), facecolor='#1e7a46')
    ax.set_facecolor('#1e7a46')
    
    # Horizontal bars
    rects1 = ax.barh(y + width/2, home_vals, width, label=home_team.name, color='#3b82f6', edgecolor='white', linewidth=1)
    rects2 = ax.barh(y - width/2, away_vals, width, label=away_team.name, color='#ef4444', edgecolor='white', linewidth=1)
    
    # Styling
    ax.set_yticks(y)
    ax.set_yticklabels(labels, color='white', fontsize=14, fontweight='bold')
    ax.xaxis.set_tick_params(colors='white')
    
    for spine in ax.spines.values():
        spine.set_color('white')
        
    ax.legend(fontsize=12, loc='upper right', framealpha=0.9)
    
    # Add labels on bars
    def autolabel(rects):
        for rect in rects:
            width = rect.get_width()
            ax.annotate(f'{width}',
                        xy=(width, rect.get_y() + rect.get_height() / 2),
                        xytext=(5, 0),
                        textcoords="offset points",
                        va='center', ha='left', color='white', fontweight='bold')

    autolabel(rects1)
    autolabel(rects2)
    
    title = f"Team Stats Comparison\n{home_team.name} vs {away_team.name}"
    ax.set_title(title, fontsize=18, fontweight='bold', color='white', pad=30)
    
    plt.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200, facecolor='#1e7a46')
    plt.close(fig)

    return FigureMeta(
        id="stats_comparison",
        src_relative=build_src_relative(out_path),
        alt=f"Statistical comparison between {home_team.name} and {away_team.name}.",
        caption="Comparison of core team metrics including possession, shots, and accuracy.",
        width=1600,
        height=1000,
        kind="stats_comparison",
    )
