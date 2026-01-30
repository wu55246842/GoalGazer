"use client";

import React from "react";
import { PlayerRow } from "@/lib/content/types";

interface FormationPitchProps {
    score: { home: number; away: number };
    homeXG: string;
    awayXG: string;
    homeFormation?: string;
    awayFormation?: string;
    homePlayers: PlayerRow[];
    awayPlayers: PlayerRow[];
    labels: {
        rating: string;
        goals: string;
        assists: string;
        minutes: string;
        positions: Record<string, string>;
    };
}

const FormationPitch: React.FC<FormationPitchProps> = ({
    score,
    homeXG,
    awayXG,
    homeFormation = "4-4-2",
    awayFormation = "4-4-2",
    homePlayers,
    awayPlayers,
    labels
}) => {

    const getPositions = (formation: string, isRightTeam: boolean) => {
        const rows = (formation || "4-4-2").replace(/\s/g, '').split("-").map(Number);
        const positions: { x: number; y: number }[] = [];

        // GK (X is distance from goal, Y is center)
        positions.push({ x: isRightTeam ? 94 : 6, y: 50 });

        const rowCount = rows.length;
        rows.forEach((count, rowIndex) => {
            // X base logic: left team goes right, right team goes left
            // We want defenders near their goal (6/94) and forwards near the midline (50)
            const xBase = isRightTeam ? 80 : 20;
            const xStep = isRightTeam ? -30 / rowCount : 30 / rowCount;
            const x = xBase + (rowIndex * xStep);

            for (let i = 0; i < count; i++) {
                // Y distribution in the row
                const yStep = 100 / (count + 1);
                positions.push({ x, y: yStep * (i + 1) });
            }
        });

        return positions;
    };

    let homeStarters = homePlayers.filter(p => p.is_starter === true);
    if (homeStarters.length === 0) homeStarters = homePlayers.slice(0, 11);
    else homeStarters = homeStarters.slice(0, 11);

    let awayStarters = awayPlayers.filter(p => p.is_starter === true);
    if (awayStarters.length === 0) awayStarters = awayPlayers.slice(0, 11);
    else awayStarters = awayStarters.slice(0, 11);

    const homePos = getPositions(homeFormation, false);
    const awayPos = getPositions(awayFormation, true);

    const renderPlayer = (p: PlayerRow, pos: { x: number; y: number }, isHome: boolean) => (
        <div key={p.id || p.name} className="player-marker-wrapper" style={{
            position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`,
            transform: "translate(-50%, -50%)", zIndex: 100
        }}>
            <div className="player-dot" style={{
                width: "14px", height: "14px", borderRadius: "50%",
                background: isHome ? "var(--color-primary)" : "var(--color-secondary)",
                border: "2px solid white", boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                cursor: "pointer", transition: "all 0.2s"
            }} />
            <div className="player-tooltip">
                <div style={{ fontWeight: 800, marginBottom: "4px", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.9, whiteSpace: "nowrap" }}>
                    <div>{labels.positions[p.position!] || p.position} • {labels.rating}: {p.rating || "N/A"}</div>
                    <div>{labels.minutes}: {p.minutes}'</div>
                    {p.goals! > 0 && <div style={{ marginTop: "2px" }}>⚽ {p.goals}</div>}
                </div>
            </div>
            <div className="player-name-label">{p.name.split(' ').pop()}</div>
        </div>
    );

    return (
        <div className="formation-pitch" style={{
            position: "relative", width: "100%", height: "450px",
            background: "repeating-linear-gradient(90deg, #2e7d32 0px, #2e7d32 60px, #388e3c 60px, #388e3c 120px)",
            borderRadius: "var(--radius-xl)", overflow: "hidden", border: "4px solid #1b5e20",
            boxShadow: "var(--shadow-lg)"
        }}>
            {/* Markings */}
            <div style={{ position: "absolute", top: 15, left: 15, right: 15, bottom: 15, border: "2px solid rgba(255,255,255,0.4)", pointerEvents: "none" }}>
                {/* Center line */}
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "rgba(255,255,255,0.4)" }} />
                {/* Center circle */}
                <div style={{ position: "absolute", top: "50%", left: "50%", width: "100px", height: "100px", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
                {/* Penalty Area Left */}
                <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: "16%", border: "2px solid rgba(255,255,255,0.4)", borderLeft: "none" }} />
                {/* Penalty Area Right */}
                <div style={{ position: "absolute", right: 0, top: "20%", bottom: "20%", width: "16%", border: "2px solid rgba(255,255,255,0.4)", borderRight: "none" }} />
            </div>

            {/* Backdrop Score */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "12rem", fontWeight: 900, color: "white", opacity: 0.05, pointerEvents: "none", display: "flex", gap: "6rem", fontFamily: "var(--font-heading)" }}>
                <div>{score.home}</div>
                <div>{score.away}</div>
            </div>

            {/* Formation Display */}
            <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", padding: "0.4rem 1.5rem", borderRadius: "100px", color: "white", fontSize: "0.85rem", fontWeight: 800, zIndex: 50, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {homeFormation} <span style={{ opacity: 0.5, margin: "0 8px" }}>VS</span> {awayFormation}
            </div>

            <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 60 }}>
                {homeStarters.map((p, i) => renderPlayer(p, homePos[i] || { x: 20, y: 50 }, true))}
                {awayStarters.map((p, i) => renderPlayer(p, awayPos[i] || { x: 80, y: 50 }, false))}
            </div>

            <style jsx>{`
        .player-marker-wrapper { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .player-marker-wrapper:hover { z-index: 200 !important; }
        .player-marker-wrapper:hover .player-dot { transform: scale(1.5); box-shadow: 0 0 15px rgba(255,255,255,0.4); }
        .player-tooltip {
          position: absolute; bottom: 150%; left: 50%; transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.95); color: #fff; padding: 10px 14px; border-radius: 8px;
          font-size: 0.85rem; opacity: 0; visibility: hidden; transition: 0.2s;
          z-index: 300; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .player-marker-wrapper:hover .player-tooltip { opacity: 1; visibility: visible; }
        .player-name-label {
          position: absolute; top: 120%; left: 50%; transform: translateX(-50%);
          color: white; font-size: 0.65rem; font-weight: 700; margin-top: 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.9); pointer-events: none; white-space: nowrap;
          background: rgba(0,0,0,0.3); padding: 1px 6px; border-radius: 4px;
        }
      `}</style>
        </div>
    );
};

export default FormationPitch;
