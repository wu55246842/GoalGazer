import React from "react";
import { Standing } from "@/lib/apiFootball";
import TeamBadge from "@/components/TeamBadge";

interface StandingsTableProps {
    standings: Standing[];
    labels: {
        rank: string;
        team: string;
        played: string;
        win: string;
        draw: string;
        lose: string;
        goals: string;
        gd: string;
        points: string;
        form: string;
    };
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, labels }) => {
    return (
        <div className="card" style={{ padding: "0", overflow: "hidden", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)" }}>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "2px solid var(--color-border)" }}>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", width: "60px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.rank}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "left", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.team}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.played}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.win}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.draw}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.lose}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.goals}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.gd}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", fontWeight: "bold", background: "rgba(255,255,255,0.02)", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{labels.points}</th>
                            <th style={{ padding: "1.25rem 1rem", textAlign: "center", width: "150px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 800 }}>{labels.form}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, idx) => (
                            <tr key={s.team.id} style={{
                                borderBottom: "1px solid var(--color-border)",
                                background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"
                            }}>
                                <td style={{ padding: "1rem", textAlign: "center", fontWeight: 800, fontSize: "1.1rem", color: idx < 4 ? "var(--color-primary)" : "inherit" }}>
                                    {s.rank}
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <TeamBadge label={s.team.name} size={32} />
                                        <span style={{ fontWeight: 700 }}>{s.team.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>{s.all.played}</td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>{s.all.win}</td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>{s.all.draw}</td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>{s.all.lose}</td>
                                <td style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-dim)", fontSize: "0.85rem" }}>
                                    {s.all.goals.for}:{s.all.goals.against}
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center", fontWeight: 600, color: s.goalsDiff > 0 ? "#4caf50" : s.goalsDiff < 0 ? "#f44336" : "inherit" }}>
                                    {s.goalsDiff > 0 ? `+${s.goalsDiff}` : s.goalsDiff}
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", fontSize: "1.1rem", background: "rgba(255,255,255,0.02)" }}>
                                    {s.points}
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                        {s.form?.split('').map((char, i) => (
                                            <div key={i} title={char} style={{
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "4px",
                                                fontSize: "0.6rem",
                                                fontWeight: 900,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                background: char === 'W' ? "#4caf50" : char === 'L' ? "#f44336" : "#757575"
                                            }}>
                                                {char}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StandingsTable;
