import React from "react";
import { Standing } from "@/lib/apiFootball";

interface PointsProgressChartProps {
    standings: Standing[];
    title: string;
}

const PointsProgressChart: React.FC<PointsProgressChartProps> = ({ standings, title }) => {
    const topTeams = standings.slice(0, 6);

    // Calculate points from form (W=3, D=1, L=0)
    const getPointsFromForm = (form: string) => {
        return form.split('').reduce((acc, char) => acc + (char === 'W' ? 3 : char === 'D' ? 1 : 0), 0);
    };

    const chartData = topTeams.map(t => ({
        name: t.team.name,
        points: getPointsFromForm(t.form || ""),
        logo: t.team.logo
    })).sort((a, b) => b.points - a.points);

    const maxPoints = 15; // 5 games max points

    return (
        <div className="card" style={{ padding: "1.5rem", height: "100%" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title} (Last 5)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {chartData.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <img src={d.logo} alt="" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                        <div style={{ flex: 1, position: "relative", height: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                            <div style={{
                                width: `${(d.points / maxPoints) * 100}%`,
                                height: "100%",
                                background: "var(--color-primary)",
                                borderRadius: "4px",
                                boxShadow: "0 0 10px rgba(var(--color-primary-rgb), 0.3)"
                            }} />
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 900, minWidth: "25px", textAlign: "right" }}>{d.points}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "var(--color-text-dim)", textAlign: "center", opacity: 0.5 }}>
                Points accumulated in the most recent 5 fixtures
            </div>
        </div>
    );
};

export default PointsProgressChart;
