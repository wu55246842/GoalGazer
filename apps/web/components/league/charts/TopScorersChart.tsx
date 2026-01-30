import React from "react";
import { PlayerStat } from "@/lib/apiFootball";

interface TopScorersChartProps {
    data: PlayerStat[];
    title: string;
}

const TopScorersChart: React.FC<TopScorersChartProps> = ({ data, title }) => {
    const chartData = data.slice(0, 5).map(p => ({
        name: p.player.name.split(' ').pop() || p.player.name,
        goals: p.statistics[0].goals.total || 0,
        logo: p.statistics[0].team.logo
    }));

    const maxGoals = Math.max(...chartData.map(d => d.goals), 1);
    const height = 300;
    const width = 500;
    const barWidth = 60;
    const gap = 30;

    return (
        <div className="card" style={{ padding: "1.5rem", height: "100%" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem", opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</h3>
            <div style={{ width: "100%", height: "220px", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-around", paddingBottom: "30px" }}>
                {chartData.map((d, i) => {
                    const barHeight = (d.goals / maxGoals) * 150;
                    return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 900, marginBottom: "8px", color: "var(--color-primary)" }}>{d.goals}</div>
                            <div style={{
                                width: "40px",
                                height: `${barHeight}px`,
                                background: "linear-gradient(to top, var(--color-primary), var(--color-secondary))",
                                borderRadius: "6px 6px 0 0",
                                position: "relative",
                                transition: "height 1s ease-out"
                            }}>
                                <div style={{ position: "absolute", bottom: "-25px", left: "50%", transform: "translateX(-50%)", width: "20px", height: "20px" }}>
                                    <img src={d.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                </div>
                            </div>
                            <div style={{ marginTop: "30px", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-dim)", whiteSpace: "nowrap" }}>{d.name}</div>
                        </div>
                    );
                })}
                {/* Y-Axis Line */}
                <div style={{ position: "absolute", left: 0, bottom: 25, right: 0, height: "1px", background: "rgba(255,255,255,0.05)" }} />
            </div>
        </div>
    );
};

export default TopScorersChart;
