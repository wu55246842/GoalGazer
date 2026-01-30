import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleLayout from "@/components/ArticleLayout";
import MatchTacticalView from "@/components/MatchTacticalView";
import ChartFigure from "@/components/ChartFigure";
import FormationPitch from "@/components/FormationPitch";
import AdUnit from "@/components/AdUnit";
import { buildArticleMetadata, buildBreadcrumbJsonLd, buildJsonLd } from "@/lib/seo";
import { listMatchIds, readMatchArticle } from "@/lib/content";
import { buildLocalizedPath, getT, normalizeLang, SUPPORTED_LANGS } from "@/i18n";

interface MatchPageProps {
  params: { lang: string; slug: string };
}

export async function generateStaticParams() {
  const slugs = await listMatchIds();
  return SUPPORTED_LANGS.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { article } = await readMatchArticle(params.slug, lang);
  if (!article) {
    return {};
  }
  return buildArticleMetadata(article, lang);
}

export default async function MatchPage({ params }: MatchPageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);
  const { article, fallback } = await readMatchArticle(params.slug, lang);
  const showFallbackNotice = fallback && lang !== "en";
  const shareLinks = [
    { href: "https://x.com/intent/tweet", label: messages.match.shareLinks.x },
    { href: "https://www.linkedin.com/shareArticle", label: messages.match.shareLinks.linkedIn },
  ];

  if (!article) {
    notFound();
  }

  const articleJsonLd = buildJsonLd(article, lang);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(article, lang, { home: t("nav.home") });
  const heroImage = article.frontmatter.heroImage ?? article.frontmatter.image;

  return (
    <ArticleLayout
      title={article.frontmatter.title}
      description={article.frontmatter.description}
      tagLabel={t("match.tagLabel")}
      shareLabel={t("match.shareLabel")}
      shareLinks={shareLinks}
    >
      {showFallbackNotice && (
        <div
          className="card"
          style={{
            marginTop: "1rem",
            background: "var(--color-bg-alt)",
            borderLeft: "4px solid var(--color-text-muted)",
            padding: "0.75rem 1rem",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            {t("match.fallbackNotice")}
          </p>
        </div>
      )}

      {/* Tactical Analysis Section (Shot Map, Stats, Timing) */}
      <MatchTacticalView
        article={article}
        lang={lang}
        labels={{
          tabs: {
            pitch: t("match.tabs.pitch"),
            stats: t("match.tabs.stats"),
            progression: t("match.tabs.progression"),
          },
          formation: {
            rating: t("match.formation.rating"),
            goals: t("match.formation.goals"),
            assists: t("match.formation.assists"),
            minutes: t("match.formation.minutes"),
          },
          metric: t("match.metric"),
          positions: {
            GK: t("match.positions.GK"),
            DF: t("match.positions.DF"),
            MF: t("match.positions.MF"),
            FW: t("match.positions.FW"),
          }
        }}
      />

      <section style={{ marginTop: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          {article.figures!
            .filter((f) => f.kind !== "shot_proxy" && f.kind !== "shot_map" && f.kind !== "timeline")
            .map((fig) => (
              <ChartFigure key={fig.id} {...fig} />
            ))}

          {/* Replaced Timeline Chart with Interactive Formation Pitch */}
          <div className="card" style={{ padding: "0", overflow: "hidden", minHeight: "450px" }}>
            {(() => {
              const m = article.match;
              const homeId = typeof m.homeTeam === 'object' ? m.homeTeam.id : 'home';
              const awayId = typeof m.awayTeam === 'object' ? m.awayTeam.id : 'away';

              let scoreObj = { home: 0, away: 0 };
              if (typeof m.score === 'string') {
                const parts = m.score.split(' - ');
                if (parts.length === 2) {
                  scoreObj = { home: parseInt(parts[0]) || 0, away: parseInt(parts[1]) || 0 };
                }
              } else if (m.score) {
                scoreObj = m.score as { home: number; away: number };
              }

              return (
                <FormationPitch
                  score={scoreObj}
                  homeXG={article.team_stats?.normalized?.[homeId!]?.xg || "0.00"}
                  awayXG={article.team_stats?.normalized?.[awayId!]?.xg || "0.00"}
                  homeFormation={m.formation?.includes(' / ') ? m.formation.split(' / ')[0] : (m.formation || "4-4-2")}
                  awayFormation={m.formation?.includes(' / ') ? m.formation.split(' / ')[1] : (m.formation || "4-4-2")}
                  homePlayers={article.players?.home || []}
                  awayPlayers={article.players?.away || []}
                  labels={{
                    rating: t("match.formation.rating"),
                    goals: t("match.formation.goals"),
                    assists: t("match.formation.assists"),
                    minutes: t("match.formation.minutes"),
                    positions: {
                      GK: t("match.positions.GK"),
                      DF: t("match.positions.DF"),
                      MF: t("match.positions.MF"),
                      FW: t("match.positions.FW"),
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>
      </section>

      {article.sections && article.sections.length > 0 && (
        <div className="article-content" style={{ marginTop: "3rem" }}>
          {article.sections.map((section, idx) => (
            <section key={idx} style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "1.75rem", marginBottom: "1.25rem", color: "var(--color-text)" }}>
                {section.heading}
              </h2>
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} style={{ marginBottom: "1.25rem", lineHeight: "1.8", color: "var(--color-text-dim)" }}>
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul style={{ marginBottom: "1.25rem", paddingLeft: "1.5rem" }}>
                  {section.bullets.map((b, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: "0.5rem", color: "var(--color-text-dim)" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {article.player_notes && article.player_notes.length > 0 && (
        <section style={{ marginTop: "4rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>{t("match.playerAnalysis")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {article.player_notes.map((note, idx) => (
              <div key={idx} className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h3 style={{ margin: 0 }}>{note.player}</h3>
                  <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>{note.team}</span>
                </div>
                {note.rating && (
                  <div style={{ fontSize: "0.9rem", color: "var(--color-primary)", fontWeight: "bold", marginBottom: "0.75rem" }}>
                    {t("match.formation.rating")}: {note.rating}
                  </div>
                )}
                <p style={{ fontSize: "0.95rem", color: "var(--color-text-dim)", lineHeight: "1.6" }}>{note.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdUnit slot="8273645192" />

      <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{article.cta}</p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </ArticleLayout>
  );
}
