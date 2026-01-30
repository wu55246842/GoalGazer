"use client";

import React, { useState } from "react";
import { Fixture } from "@/lib/apiFootball";

interface FixturesPanelProps {
    fixtures: Fixture[];
    lang: string;
    labels: {
        upcoming: string;
        recent: string;
        live: string;
    };
}

const FixturesPanel: React.FC<FixturesPanelProps> = ({ fixtures, lang, labels }) => {
    const [activeTab, setActiveTab] = useState<"upcoming" | "recent" | "live">("recent");

    const filteredFixtures = fixtures.filter(f => {
        const status = f.fixture.status.short;
        if (activeTab === "live") return ["1H", "HT", "2H", "ET", "P"].includes(status);
        if (activeTab === "upcoming") return ["TBD", "NS"].includes(status);
        if (activeTab === "recent") return ["FT", "AET", "PEN"].includes(status);
        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.fixture.date).getTime();
        const dateB = new Date(b.fixture.date).getTime();
        return activeTab === "recent" ? dateB - dateA : dateA - dateB;
    }).slice(0, 10);

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat(lang, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(dateStr));
    };

    return (
        <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                {(["upcoming", "recent", "live"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: "0.5rem 1.25rem",
                            borderRadius: "100px",
                            border: "none",
                            background: activeTab === tab ? "var(--color-primary)" : "transparent",
                            color: activeTab === tab ? "white" : "var(--color-text-muted)",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {labels[tab]}
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {filteredFixtures.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-dim)", fontStyle: "italic" }}>
                        No matches found.
                    </div>
                ) : (
                    filteredFixtures.map(f => (
                        <div key={f.fixture.id} style={{
                            display: "grid",
                            gridTemplateColumns: "80px 1fr 60px 1fr 40px",
                            alignItems: "center",
                            padding: "1rem",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "var(--radius-md)",
                            gap: "1rem"
                        }}>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                                {formatDate(f.fixture.date)}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end", textAlign: "right" }}>
                                <span style={{ fontWeight: 700 }}>{f.teams.home.name}</span>
                                <img src={f.teams.home.logo} alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                            </div>

                            <div style={{
                                background: "var(--color-bg)",
                                padding: "0.4rem",
                                borderRadius: "4px",
                                textAlign: "center",
                                fontWeight: 900,
                                fontSize: "1.1rem",
                                color: "var(--color-primary)",
                                border: "1px solid var(--color-border)"
                            }}>
                                {f.goals.home ?? "-"} : {f.goals.away ?? "-"}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <img src={f.teams.away.logo} alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                                <span style={{ fontWeight: 700 }}>{f.teams.away.name}</span>
                            </div>

                            <div style={{ fontSize: "0.75rem", textAlign: "right", color: "var(--color-text-dim)", fontWeight: 600 }}>
                                {f.fixture.status.short}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FixturesPanel;
