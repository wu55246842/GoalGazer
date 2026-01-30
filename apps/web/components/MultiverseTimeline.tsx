"use client";

import React from "react";
import { MultiversePivot } from "@/lib/content/types";

interface MultiverseTimelineProps {
    pivots: MultiversePivot[];
    activePivotIndex: number;
    onPivotSelect: (index: number) => void;
}

const MultiverseTimeline: React.FC<MultiverseTimelineProps> = ({
    pivots,
    activePivotIndex,
    onPivotSelect,
}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            padding: "1rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255,255,255,0.05)"
        }}>
            <h4 style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem"
            }}>
                Pivot Points
            </h4>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem"
            }}>
                {pivots.map((pivot, index) => (
                    <button
                        key={index}
                        onClick={() => onPivotSelect(index)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            background: activePivotIndex === index ? "rgba(255,255,255,0.05)" : "transparent",
                            border: "none",
                            borderRadius: "var(--radius-lg)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.2s ease",
                            borderLeft: `3px solid ${activePivotIndex === index ? "var(--color-primary)" : "transparent"}`
                        }}
                    >
                        <span style={{
                            fontWeight: 900,
                            fontSize: "0.9rem",
                            color: activePivotIndex === index ? "var(--color-primary)" : "var(--color-text-muted)",
                            width: "2rem"
                        }}>
                            {pivot.minute}'
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                color: activePivotIndex === index ? "white" : "var(--color-text-muted)"
                            }}>
                                {pivot.description}
                            </div>
                        </div>
                        <span style={{ fontSize: "1rem" }}>
                            {pivot.type === "goal" ? "⚽" :
                                pivot.type === "card" ? "🟥" :
                                    pivot.type === "penalty" ? "🥅" :
                                        pivot.type === "substitution" ? "⇄" : "⚡"}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MultiverseTimeline;
