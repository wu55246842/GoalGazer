import React from "react";
import { Standing } from "@/lib/apiFootball";
import TeamBadge from "@/components/TeamBadge";

interface GoalsForAgainstChartProps {
    standings: Standing[];
    title: string;
}

const GoalsForAgainstChart: React.FC<GoalsForAgainstChartProps> = ({ standings, title }) => {
    const topTeams = standings.slice(0, 5);
    const maxGoals = Math.max(...topTeams.flatMap(t => [t.all.goals.for, t.all.goals.against]), 1);

    return (
        <div className="card" style={{ padding: "1.5rem", height: "100%" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {topTeams.map((t, i) => {
                    const forPercent = (t.all.goals.for / maxGoals) * 100;
                    const againstPercent = (t.all.goals.against / maxGoals) * 100;

                    return (
                        <div key={t.team.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <TeamBadge label={t.team.name} size={24} />
                            <div style={{ flex: 1 }}>
                                <div style={{ height: "12px", width: "100%", background: "rgba(255,b,b,0.05)", borderRadius: "6px", overflow: "hidden", marginBottom: "4px", display: "flex" }}>
                                    <div style={{ width: `${forPercent}%`, height: "100%", background: "var(--color-primary)", borderRadius: "6px" }} />
                                </div>
                                <div style={{ height: "12px", width: "100%", background: "rgba(255,b,b,0.05)", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
                                    <div style={{ width: `${againstPercent}%`, height: "100%", background: "var(--color-secondary)", opacity: 0.6, borderRadius: "6px" }} />
                                </div>
                            </div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, minWidth: "40px", textAlign: "right" }}>
                                <span style={{ color: "var(--color-primary)" }}>{t.all.goals.for}</span>
                                <span style={{ margin: "0 2px", opacity: 0.3 }}>/</span>
                                <span style={{ color: "var(--color-secondary)" }}>{t.all.goals.against}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1.5rem", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, opacity: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "8px", height: "8px", background: "var(--color-primary)", borderRadius: "2px" }} /> GOALS FOR
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "8px", height: "8px", background: "var(--color-secondary)", opacity: 0.6, borderRadius: "2px" }} /> GOALS AGAINST
                </div>
            </div>
        </div>
    );
};

export default GoalsForAgainstChart;
