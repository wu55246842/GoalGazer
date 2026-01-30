import React from "react";
import Link from "next/link";
import { getAllLeagues } from "@/lib/leagues";
import { getT, normalizeLang } from "@/i18n";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    const lang = normalizeLang(params.lang);
    const { t } = await getT(lang);
    return {
        title: `${t("leagues.overviewTitle")} | GoalGazer`,
        description: t("leagues.selectLeague"),
    };
}

export default async function LeaguesPage({ params }: { params: { lang: string } }) {
    const lang = normalizeLang(params.lang);
    const { t } = await getT(lang);
    const leagues = getAllLeagues();

    return (
        <main style={{ padding: "4rem 2rem", maxWidth: "1680px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                <h1 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "1rem", color: "var(--color-primary)" }}>
                    {t("leagues.overviewTitle")}
                </h1>
                <p style={{ fontSize: "1.25rem", color: "var(--color-text-dim)", maxWidth: "600px", margin: "0 auto" }}>
                    {t("leagues.selectLeague")}
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "2rem"
            }}>
                {leagues.map((league) => (
                    <Link
                        key={league.slug}
                        href={`/${lang}/leagues/${league.slug}`}
                        className="card league-card-sc"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "2.5rem",
                            textAlign: "center",
                            textDecoration: "none",
                            background: "var(--color-bg-alt)",
                            position: "relative",
                            overflow: "hidden",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-xl)"
                        }}
                    >
                        <div style={{
                            width: "120px",
                            height: "120px",
                            background: "white",
                            borderRadius: "50%",
                            padding: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "1.5rem",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                        }}>
                            <img src={league.logo} alt={league.name} style={{ width: "80%", height: "auto", objectFit: "contain" }} />
                        </div>

                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.5rem 0" }}>
                            {t(`leagues.${league.slug}` as any)}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                            <img src={league.flag} alt="" style={{ width: "16px", height: "auto" }} />
                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{league.country}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
