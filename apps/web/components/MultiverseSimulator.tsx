"use client";

import React, { useState } from "react";
import { MultiverseData } from "@/lib/content/types";
import MultiverseTimeline from "./MultiverseTimeline";

interface MultiverseSimulatorProps {
    data: MultiverseData;
    lang: string;
}

const MultiverseSimulator: React.FC<MultiverseSimulatorProps> = ({ data, lang }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const pivot = data.pivots[activeIndex];

    const isZh = lang.startsWith("zh");

    return (
        <div style={{
            marginTop: "3rem",
            background: "rgba(255,255,255,0.01)",
            borderRadius: "var(--radius-2xl)",
            padding: "2rem",
            border: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "var(--font-body)"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginBottom: "2rem"
            }}>
                <h3 style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    fontFamily: "var(--font-heading)",
                    background: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    width: "fit-content"
                }}>
                    {isZh ? "战术多重宇宙模拟器" : "Tactical Multi-Verse Simulator"}
                </h3>
                <p style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    maxWidth: "600px"
                }}>
                    {data.summary}
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "300px 1fr",
                gap: "2rem"
            }} className="simulator-grid">

                <MultiverseTimeline
                    pivots={data.pivots}
                    activePivotIndex={activeIndex}
                    onPivotSelect={setActiveIndex}
                />

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem"
                }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem"
                    }} className="scenario-grid">

                        {/* Reality View */}
                        <div style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "var(--radius-xl)",
                            padding: "1.5rem",
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem"
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    padding: "0.25rem 0.5rem",
                                    background: "rgba(255,b,b,0.1)",
                                    color: "var(--color-primary)",
                                    borderRadius: "4px"
                                }}>
                                    {isZh ? "现实" : "Reality"}
                                </span>
                                <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>{pivot.reality.event}</span>
                            </div>
                            <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--color-text-light)" }}>
                                <strong>{isZh ? "结果：" : "Outcome: "}</strong> {pivot.reality.outcome}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                background: "rgba(0,0,0,0.2)",
                                padding: "1rem",
                                borderRadius: "8px",
                                color: "rgba(255,255,255,0.6)",
                                fontStyle: "italic"
                            }}>
                                {pivot.reality.tactical_impact}
                            </div>
                        </div>

                        {/* Symmetry (AI) View */}
                        <div style={{
                            background: "linear-gradient(135deg, rgba(var(--color-secondary-rgb), 0.05) 0%, rgba(var(--color-primary-rgb), 0.05) 100%)",
                            borderRadius: "var(--radius-xl)",
                            padding: "1.5rem",
                            border: "1px solid var(--color-secondary)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            boxShadow: "0 0 30px rgba(var(--color-secondary-rgb), 0.1)"
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    padding: "0.25rem 0.5rem",
                                    background: "var(--color-secondary)",
                                    color: "white",
                                    borderRadius: "4px"
                                }}>
                                    {isZh ? "AI 对称性" : "AI Symmetry"}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{pivot.symmetry.event}</span>
                            </div>
                            <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--color-text-light)" }}>
                                <strong>{isZh ? "分支结果：" : "Branch Outcome: "}</strong> {pivot.symmetry.outcome}
                            </div>
                            <div style={{
                                fontSize: "0.85rem",
                                background: "rgba(255,255,255,0.05)",
                                padding: "1rem",
                                borderRadius: "8px",
                                color: "var(--color-secondary)",
                                fontWeight: 500
                            }}>
                                {pivot.symmetry.tactical_impact}
                            </div>
                            {pivot.symmetry.probability && (
                                <div style={{ fontSize: "0.75rem", opacity: 0.5, textAlign: "right" }}>
                                    {isZh ? "AI 概览概率：" : "AI Confidence: "} {(pivot.symmetry.probability * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>

                    </div>

                    <div style={{
                        background: "rgba(255,255,255,0.02)",
                        padding: "1.5rem",
                        borderRadius: "var(--radius-xl)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.4)",
                        textAlign: "center"
                    }}>
                        {isZh ? "正在计算此时间线对最终比分的连锁反应..." : "Calculating ripple effects of this timeline on the final score..."}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .simulator-grid { grid-template-columns: 1fr !important; }
                    .scenario-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
};

export default MultiverseSimulator;
