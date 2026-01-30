import React from "react";
import { LeagueConfig } from "@/lib/leagues";

interface LeagueHeaderProps {
    league: LeagueConfig;
    labels: {
        country: string;
        season: string;
    };
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ league, labels }) => {
    return (
        <header className="card" style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            padding: "2rem",
            marginBottom: "2rem",
            background: "var(--color-bg-alt)",
            borderLeft: "6px solid var(--color-primary)",
            borderRadius: "var(--radius-xl)",
            borderTop: "1px solid var(--color-border)",
            borderRight: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)"
        }}>
            <div style={{
                width: "100px",
                height: "100px",
                background: "white",
                borderRadius: "var(--radius-lg)",
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)"
            }}>
                <img src={league.logo} alt={league.name} style={{ width: "100%", height: "auto", objectFit: "contain" }} />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <img src={league.flag} alt={league.country} style={{ width: "24px", height: "auto", borderRadius: "2px" }} />
                    <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {league.country}
                    </span>
                </div>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 900, fontFamily: "var(--font-heading)", margin: "0 0 0.5rem 0", color: "var(--color-text)" }}>
                    {league.name}
                </h1>
                <div style={{ display: "flex", gap: "1.5rem", fontSize: "1rem", color: "var(--color-text-dim)" }}>
                    <div>
                        <strong>{labels.season}:</strong> {league.season}/{league.season + 1}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default LeagueHeader;
