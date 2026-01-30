"use client";

import React, { useState } from "react";
import { PlayerStat } from "@/lib/apiFootball";

interface LeadersPanelProps {
    topScorers: PlayerStat[];
    topAssists: PlayerStat[];
    labels: {
        topScorers: string;
        topAssists: string;
        goals: string;
        assists: string;
        appearances: string;
    };
}

const LeadersPanel: React.FC<LeadersPanelProps> = ({ topScorers, topAssists, labels }) => {
    const [activeTab, setActiveTab] = useState<"scorers" | "assists">("scorers");

    const data = activeTab === "scorers" ? topScorers : topAssists;
    const maxVal = Math.max(...data.map(p => {
        const stat = p.statistics[0];
        return activeTab === "scorers" ? (stat.goals.total || 0) : (stat.goals.assists || 0);
    }), 1);

    return (
        <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                <button
                    onClick={() => setActiveTab("scorers")}
                    style={{
                        padding: "0.5rem 1.25rem",
                        borderRadius: "100px",
                        border: "none",
                        background: activeTab === "scorers" ? "var(--color-primary)" : "transparent",
                        color: activeTab === "scorers" ? "white" : "var(--color-text-muted)",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {labels.topScorers}
                </button>
                <button
                    onClick={() => setActiveTab("assists")}
                    style={{
                        padding: "0.5rem 1.25rem",
                        borderRadius: "100px",
                        border: "none",
                        background: activeTab === "assists" ? "var(--color-primary)" : "transparent",
                        color: activeTab === "assists" ? "white" : "var(--color-text-muted)",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {labels.topAssists}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {data.slice(0, 10).map((p, idx) => {
                    const stat = p.statistics[0];
                    const value = activeTab === "scorers" ? (stat.goals.total || 0) : (stat.goals.assists || 0);
                    const percent = (value / maxVal) * 100;

                    return (
                        <div key={p.player.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: "30px", fontSize: "1.2rem", fontWeight: 900, opacity: 0.2 }}>{idx + 1}</div>
                            <img src={p.player.photo} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-bg-alt)", border: "2px solid rgba(255,255,255,0.05)" }} />

                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{p.player.name}</div>
                                    <div style={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "1.1rem" }}>{value}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <img src={stat.team.logo} alt="" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
                                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>{stat.team.name} • {stat.games.appearences} {labels.appearances}</span>
                                </div>
                                <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                                    <div style={{
                                        width: `${percent}%`,
                                        height: "100%",
                                        background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
                                        borderRadius: "2px",
                                        transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LeadersPanel;
