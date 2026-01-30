"use client";

import React, { useState } from "react";
import type { MatchArticle, PlayerRow } from "@/lib/content/types";
import ChartFigure from "./ChartFigure";
import MultiverseSimulator from "./MultiverseSimulator";

interface MatchTacticalViewProps {
    article: MatchArticle;
    lang: string;
    labels: {
        tabs: { pitch: string; stats: string; progression: string; multiverse?: string };
        formation: { rating: string; goals: string; assists: string; minutes: string };
        metric: string;
        positions: Record<string, string>;
    };
}

const MatchTacticalView: React.FC<MatchTacticalViewProps> = ({ article, lang, labels }) => {
    const [activeTab, setActiveTab] = useState<"field" | "stats" | "timing" | "multiverse">("field");
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const { match, players, team_stats, timeline } = article;

    const homeTeam = typeof match.homeTeam === 'string' ? { name: match.homeTeam } : match.homeTeam;
    const awayTeam = typeof match.awayTeam === 'string' ? { name: match.awayTeam } : match.awayTeam;

    let scoreObj = { home: 0, away: 0 };
    if (typeof match.score === 'string') {
        const parts = match.score.split(' - ');
        if (parts.length === 2) {
            scoreObj = { home: parseInt(parts[0]) || 0, away: parseInt(parts[1]) || 0 };
        }
    } else if (match.score) {
        scoreObj = match.score as { home: number; away: number };
    }

    const getPlayerEvents = (playerId?: string) => {
        if (!playerId || !timeline) return [];
        return timeline.filter(e => e.playerId === playerId || e.assistId === playerId);
    };

    const renderPlayerRow = (p: PlayerRow) => {
        const events = getPlayerEvents(p.id);
        return (
            <div key={p.id || p.name} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0",
                fontSize: "0.875rem",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                opacity: p.is_starter ? 1 : 0.6,
                fontFamily: "var(--font-body)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                        color: "var(--color-text-light)",
                        width: "2.5rem",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                    }}>
                        {labels.positions[p.position!] || p.position || "FW"}
                    </span>
                    <span style={{ fontWeight: p.is_starter ? 500 : 400 }}>{p.name}</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                        {events.map((e, i) => (
                            <span key={i} title={e.detail || e.type} style={{ fontSize: "0.9rem" }}>
                                {e.type === "goal" ? "⚽" :
                                    e.type === "card" && e.detail?.toLowerCase().includes("yellow") ? "🟨" :
                                        e.type === "card" && e.detail?.toLowerCase().includes("red") ? "🟥" :
                                            e.type === "subst" ? "⇄" : ""}
                            </span>
                        ))}
                    </div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    {p.minutes}'
                </div>
            </div>
        );
    };

    const homePlayers = players?.home || [];
    const awayPlayers = players?.away || [];

    const homeId = (match.homeTeam as any).id || "home";
    const awayId = (match.awayTeam as any).id || "away";
    const homeXG = team_stats?.normalized?.[homeId]?.xg || "0.00";
    const awayXG = team_stats?.normalized?.[awayId]?.xg || "0.00";

    const homeFormationStr = match.formation?.includes(' / ') ? match.formation.split(' / ')[0] : (match.formation || "4-4-2");
    const awayFormationStr = match.formation?.includes(' / ') ? match.formation.split(' / ')[1] : (match.formation || "4-4-2");

    const translateEventDetail = (detail: string | undefined, type: string) => {
        if (!detail) return type;
        const d = detail.toLowerCase();
        const isZh = lang.startsWith('zh');

        if (isZh) {
            if (d.includes('normal goal')) return '进球';
            if (d.includes('yellow card')) return '黄牌';
            if (d.includes('red card')) return '红牌';
            if (d.includes('substitution')) return '换人';
            if (d.includes('var')) return 'VAR检查';
            if (d.includes('penalty')) return '点球';
            if (d.includes('own goal')) return '乌龙球';
        }
        return detail;
    };

    return (
        <div className="match-tactical-view" style={{ marginTop: "3rem", fontFamily: "var(--font-body)" }}>
            {/* Header Info */}
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                <div style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "var(--color-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    marginBottom: "0.5rem",
                    fontFamily: "var(--font-heading)"
                }}>
                    {match.league} {match.season}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 400 }}>
                    {match.venue} • {new Date(match.date_utc).toLocaleString(lang, { dateStyle: 'long', timeStyle: 'short' })}
                </div>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 1fr",
                gap: "3rem",
                alignItems: "start"
            }} className="tactical-grid">

                <div className="lineup-col">
                    <h2 style={{
                        borderBottom: "3px solid var(--color-primary)",
                        paddingBottom: "1rem",
                        marginBottom: "1.5rem",
                        fontSize: "2rem",
                        fontWeight: 900,
                        fontFamily: "var(--font-heading)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline"
                    }}>
                        {homeTeam.name}
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, opacity: 0.5 }}>{homeFormationStr}</span>
                    </h2>
                    <div>{homePlayers.map(renderPlayerRow)}</div>
                </div>

                <div className="viz-col">
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "1.5rem",
                        marginBottom: "2rem",
                        padding: "0.5rem",
                        background: "var(--color-bg-alt)",
                        borderRadius: "var(--radius-full)",
                        width: "fit-content",
                        margin: "0 auto 2rem auto"
                    }}>
                        {(["field", "timing", "stats", "multiverse"] as const)
                            .filter(tab => tab !== "multiverse" || article.multiverse)
                            .map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: "0.6rem 1.5rem",
                                        background: activeTab === tab ? "var(--color-card-bg)" : "transparent",
                                        border: "none",
                                        borderRadius: "var(--radius-full)",
                                        color: activeTab === tab ? "var(--color-text)" : "var(--color-text-muted)",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none"
                                    }}
                                >
                                    {tab === "field" ? labels.tabs.pitch : tab === "timing" ? labels.tabs.progression : tab === "stats" ? labels.tabs.stats : labels.tabs.multiverse}
                                </button>
                            ))}
                    </div>

                    <div
                        className="pulse-bg"
                        style={{
                            borderRadius: "var(--radius-2xl)",
                            padding: activeTab === "field" ? "0" : "2rem",
                            minHeight: "500px",
                            position: "relative",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.05)",
                            // Calculate pulse speed: more events = faster pulse
                            // @ts-ignore
                            "--pulse-speed": `${Math.max(1.2, 5 - (timeline?.length || 0) / 10)}s`
                        }}
                    >
                        {activeTab === "field" && (
                            <div style={{ position: "relative", zIndex: 1 }}>
                                {/* Score/xG Overlay for Pitch */}
                                <div style={{
                                    position: "absolute",
                                    top: "15%",
                                    left: 0,
                                    right: 0,
                                    textAlign: "center",
                                    zIndex: 10,
                                    pointerEvents: "none",
                                    fontFamily: "var(--font-heading)"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "3rem",
                                        fontSize: "10rem",
                                        fontWeight: 900,
                                        opacity: 0.15,
                                        lineHeight: 1,
                                        letterSpacing: "-0.05em"
                                    }}>
                                        <div style={{ color: "var(--color-primary)" }}>{scoreObj.home}</div>
                                        <div style={{ color: "var(--color-secondary)" }}>{scoreObj.away}</div>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "7rem",
                                        fontSize: "2.5rem",
                                        fontWeight: 800,
                                        opacity: 0.3,
                                        marginTop: "-1rem"
                                    }}>
                                        <div style={{ color: "var(--color-primary)" }}>{homeXG}</div>
                                        <div style={{ color: "var(--color-secondary)" }}>{awayXG}</div>
                                    </div>
                                </div>

                                {/* Original Shot Map */}
                                <div style={{ position: "relative", zIndex: 1 }}>
                                    {article.figures?.filter(f => f.kind === "shot_proxy").map(fig => (
                                        <ChartFigure key={fig.id} {...fig} />
                                    ))}
                                    {(!article.figures || article.figures.length === 0) && (
                                        <div style={{ height: "500px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: "1.25rem", fontWeight: 600 }}>
                                            {lang.startsWith('zh') ? "暂无比赛图表" : "No match visual available."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "stats" && team_stats?.normalized && (
                            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem" }}>
                                    <thead>
                                        <tr style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            <th style={{ textAlign: "left", padding: "1rem" }}>{homeTeam.name}</th>
                                            <th style={{ textAlign: "center", padding: "1rem" }}>{labels.metric}</th>
                                            <th style={{ textAlign: "right", padding: "1rem" }}>{awayTeam.name}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(team_stats?.normalized?.[homeId] || {}).map(key => {
                                            const hVal = team_stats?.normalized?.[homeId]?.[key];
                                            const aVal = team_stats?.normalized?.[awayId]?.[key];
                                            if (hVal === undefined || aVal === undefined) return null;
                                            return (
                                                <tr key={key} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)" }}>
                                                    <td style={{ padding: "1.25rem 1rem", textAlign: "left", fontWeight: 800, fontSize: "1.25rem", color: "white" }}>{hVal}</td>
                                                    <td style={{ padding: "1.25rem 1rem", textAlign: "center", textTransform: "capitalize", fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                                                        {key.replace(/_/g, " ")}
                                                    </td>
                                                    <td style={{ padding: "1.25rem 1rem", textAlign: "right", fontWeight: 800, fontSize: "1.25rem", color: "white" }}>{aVal}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "timing" && (
                            <div className="timing-container" style={{ animation: "fadeIn 0.3s ease-out" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {timeline?.map((e, idx) => (
                                        <div key={idx} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1.5rem",
                                            padding: "1.25rem",
                                            background: "rgba(255,b,b,0.04)",
                                            borderRadius: "var(--radius-lg)",
                                            borderLeft: `5px solid ${e.teamId === homeId ? "var(--color-primary)" : "var(--color-secondary)"}`,
                                            transition: "transform 0.2s"
                                        }}>
                                            <div style={{ fontWeight: 900, width: "3rem", fontSize: "1.25rem", color: e.teamId === homeId ? "var(--color-primary)" : "var(--color-secondary)" }}>{e.minute}'</div>
                                            <div style={{ fontSize: "1.75rem" }}>
                                                {e.type === "goal" ? "⚽" : e.type === "card" && e.detail?.toLowerCase().includes("yellow") ? "🟨" : e.type === "card" && e.detail?.toLowerCase().includes("red") ? "🟥" : e.type === "subst" ? "⇄" : e.type === "var" ? "🖥️" : "•"}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "white" }}>{e.playerName}</div>
                                                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>{translateEventDetail(e.detail, e.type)}</div>
                                            </div>
                                            {e.score_after && <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "white", background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "8px" }}>{e.score_after.home} - {e.score_after.away}</div>}
                                        </div>
                                    ))}
                                </div>
                                {article.figures?.find(f => f.kind === "timeline") && (
                                    <div className="timeline-mini-graphic">
                                        <span style={{ fontSize: "0.7rem", fontWeight: 800, opacity: 0.3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", display: "block" }}>
                                            {lang.startsWith('zh') ? "全场走势图" : "Visual Timeline"}
                                        </span>
                                        <div
                                            onClick={() => setShowTimelineModal(true)}
                                            style={{
                                                position: "relative",
                                                cursor: "pointer",
                                                overflow: "hidden",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                aspectRatio: "3/4"
                                            }}
                                            className="thumbnail-hover"
                                        >
                                            <img
                                                src={article.figures.find(f => f.kind === "timeline")!.src}
                                                alt="Timeline Summary"
                                                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                                            />
                                            <div style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "rgba(0,0,0,0.4)",
                                                color: "white",
                                                fontWeight: 700,
                                                fontSize: "0.8rem",
                                                opacity: 0,
                                                transition: "opacity 0.2s"
                                            }} className="overlay-text">
                                                {lang.startsWith('zh') ? "点击放大" : "Click to view"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {showTimelineModal && article.figures?.find(f => f.kind === "timeline") && (
                            <div
                                style={{
                                    position: "fixed",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.9)",
                                    zIndex: 1000,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "2rem",
                                    backdropFilter: "blur(10px)",
                                    animation: "fadeIn 0.2s ease-out"
                                }}
                                onClick={() => setShowTimelineModal(false)}
                            >
                                <button style={{ position: "absolute", top: "2rem", right: "2rem", background: "none", border: "none", color: "white", fontSize: "2rem", cursor: "pointer", zIndex: 1010 }}>×</button>
                                <img
                                    src={article.figures.find(f => f.kind === "timeline")!.src}
                                    alt="Full Timeline"
                                    style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "12px", boxShadow: "0 0 50px rgba(0,0,0,0.5)" }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        {activeTab === "multiverse" && article.multiverse && (
                            <MultiverseSimulator data={article.multiverse} lang={lang} />
                        )}
                    </div>
                    <div style={{ textAlign: "right", opacity: 0.1, fontSize: "0.7rem", marginTop: "1rem", fontWeight: 700 }}>GOALGAZER.XYZ</div>
                </div>

                <div className="lineup-col">
                    <h2 style={{
                        borderBottom: "3px solid var(--color-secondary)",
                        paddingBottom: "1rem",
                        marginBottom: "1.5rem",
                        fontSize: "2rem",
                        fontWeight: 900,
                        fontFamily: "var(--font-heading)",
                        display: "flex",
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "baseline"
                    }}>
                        {awayTeam.name}
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, opacity: 0.5 }}>{awayFormationStr}</span>
                    </h2>
                    <div>{awayPlayers.map(renderPlayerRow)}</div>
                </div>

            </div>

            <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .timing-container {
          display: grid;
          grid-template-columns: ${article.figures?.some(f => f.kind === "timeline") ? "1.6fr 1fr" : "1fr"};
          gap: 2rem;
        }
        .timeline-mini-graphic {
          position: sticky;
          top: 1rem;
          height: fit-content;
          background: rgba(255,255,255,0.03);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255,255,255,0.05);
          width: 200px;
        }
        .thumbnail-hover:hover img { opacity: 0.4 !important; transition: opacity 0.2s; }
        .thumbnail-hover:hover .overlay-text { opacity: 1 !important; }
        @media (max-width: 1024px) {
          .tactical-grid { grid-template-columns: 1fr !important; }
          .lineup-col { order: 2; }
          .viz-col { order: 1; margin-bottom: 3rem; }
        }
        @media (max-width: 768px) {
          .timing-container { grid-template-columns: 1fr !important; }
          .timeline-mini-graphic { display: none; }
        }
      `}</style>
        </div>
    );
};

export default MatchTacticalView;
