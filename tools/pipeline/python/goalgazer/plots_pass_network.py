from __future__ import annotations

from pathlib import Path
from collections import Counter
from typing import Tuple

import matplotlib.pyplot as plt
from mplsoccer import Pitch

from .schemas import MatchData, FigureMeta
from .figure_paths import build_src_relative


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

    # Use professional grass green pitch
    pitch = Pitch(
        pitch_type="statsbomb", 
        pitch_color="#1e7a46",  # Professional grass green
        line_color="#ffffff",    # White lines
        line_zorder=2,
        linewidth=2
    )
    fig, ax = pitch.draw(figsize=(14, 10))
    
    # Add subtle grass texture effect
    ax.set_facecolor("#1e7a46")

    # Get players for this team and calculate average positions
    players = [player for player in match.players if player.teamId == team.id]
    player_positions = {}
    
    for player in players:
        events = [event for event in match.events if event.playerId == player.id]
        if events:
            xs = [event.x for event in events]
            ys = [event.y for event in events]
            x_mean = sum(xs) / len(xs)
            y_mean = sum(ys) / len(ys)
            player_positions[player.id] = (x_mean, y_mean, player)
    
    # Draw pass links first (behind players)
    max_link = max(link_counts.values()) if link_counts else 1
    for (src, dst), count in link_counts.items():
        if src in player_positions and dst in player_positions:
            src_x, src_y, _ = player_positions[src]
            dst_x, dst_y, _ = player_positions[dst]
            
            # Thicker, more visible lines
            pitch.lines(
                src_x, src_y, dst_x, dst_y,
                ax=ax,
                color="#ffffff",
                lw=1 + (count / max_link) * 5,
                alpha=0.4 + (count / max_link) * 0.5,
                zorder=1
            )
    
    # Draw players with formation positions
    for player_id, (x_mean, y_mean, player) in player_positions.items():
        pass_count = player_counts.get(player_id, 0)
        
        # Size based on pass involvement
        size = max(200, min(600, 200 + pass_count * 20))
        
        # Player marker - white circle with team color border
        team_color = "#3b82f6" if team_side == "home" else "#ef4444"
        
        pitch.scatter(
            x_mean, y_mean, 
            s=size, 
            ax=ax, 
            color="#ffffff",
            edgecolor=team_color,
            linewidth=3,
            alpha=0.95,
            zorder=3
        )
        
        # Player name - split to get last name or first word
        name_parts = player.name.split(" ")
        display_name = name_parts[-1] if len(name_parts) > 1 else player.name
        
        # Player name text
        ax.text(
            x_mean, y_mean, 
            display_name[:10],  # Limit length
            ha="center", 
            va="center", 
            fontsize=9,
            fontweight="bold",
            color="#1e7a46",  # Dark green text
            zorder=4
        )
        
        # Position label (if available)
        if player.position:
            ax.text(
                x_mean, y_mean - 3, 
                player.position,
                ha="center", 
                va="top", 
                fontsize=7,
                color="#ffffff",
                alpha=0.8,
                zorder=4
            )

    # Enhanced title
    title = f"{match.match.homeTeam['name']} vs {match.match.awayTeam['name']}\n{team.name} Pass Network & Formation"
    ax.set_title(title, fontsize=14, fontweight="bold", color="#1e7a46", pad=20)
    
    # Add legend
    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor='#ffffff', edgecolor=team_color, linewidth=2, label=f'{team.name} Players'),
        Patch(facecolor='none', edgecolor='#ffffff', linewidth=3, label='Pass Connections')
    ]
    ax.legend(handles=legend_elements, loc='upper right', framealpha=0.9)
    
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=200, facecolor='#1e7a46')
    plt.close(fig)

    return FigureMeta(
        id=f"pass_network_{team_side}",
        src_relative=build_src_relative(out_path),
        alt=f"Pass network and formation for {team.name} showing player positions and passing connections.",
        caption=f"{team.name} pass network with average player positions and key passing links.",
        width=1600,
        height=1000,
        kind="pass_network",
    )
