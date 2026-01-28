import { notFound } from "next/navigation";
import ArticleLayout from "../../../../components/ArticleLayout";
import LanguageSwitcher from "../../../../components/LanguageSwitcher";
import MatchHeader from "../../../../components/MatchHeader";
import ChartFigure from "../../../../components/ChartFigure";
import {
  buildArticleMetadata,
  buildBreadcrumbJsonLd,
  buildJsonLd,
} from "../../../../lib/seo";
import { loadArticleLocalized, listMatchIds } from "../../../../lib/content";
import { supportedLanguages, uiText, type SupportedLanguage } from "../../../../lib/i18n";

interface MatchPageProps {
  params: { matchId: string };
  searchParams?: { lang?: string };
}

export async function generateStaticParams() {
  return listMatchIds().map((matchId) => ({ matchId }));
}

export function generateMetadata({ params, searchParams }: MatchPageProps) {
  const requestedLang = normalizeLanguage(searchParams?.lang);
  const { article } = loadArticleLocalized(params.matchId, requestedLang);
  if (!article) {
    return {};
  }
  return buildArticleMetadata(article);
}

export default function MatchPage({ params, searchParams }: MatchPageProps) {
  const requestedLang = normalizeLanguage(searchParams?.lang);
  const { article, fallback } = loadArticleLocalized(params.matchId, requestedLang);

  if (!article) {
    notFound();
  }

  const uiLang = requestedLang;
  const labels = uiText[uiLang];
  const articleJsonLd = buildJsonLd(article);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(article);

  return (
    <ArticleLayout
      title={article.frontmatter.title}
      description={article.frontmatter.description}
      tagLabel={labels.matchAnalysis}
      shareLabel={labels.share}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <LanguageSwitcher currentLanguage={uiLang} label={labels.languageLabel} />
      </div>
      {fallback && (
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
            {uiText[uiLang].fallbackNotice}
          </p>
        </div>
      )}
      <MatchHeader
        homeTeam={
          typeof article.match.homeTeam === "object"
            ? (article.match.homeTeam as any).name
            : article.match.homeTeam
        }
        awayTeam={
          typeof article.match.awayTeam === "object"
            ? (article.match.awayTeam as any).name
            : article.match.awayTeam
        }
        score={
          typeof article.match.score === "object"
            ? `${(article.match.score as any).home}-${(article.match.score as any).away}`
            : article.match.score
        }
        dateUtc={article.match.date_utc}
        league={article.match.league}
        round={article.match.round ?? ""}
        venue={article.match.venue ?? ""}
        labels={{
          venue: labels.venue,
          kickoff: labels.kickoff,
          status: labels.status,
          fullTime: labels.fullTime,
        }}
        locale={labels.locale}
      />
      {(article.figures || []).length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2>{labels.matchVisuals}</h2>
          {(article.figures || []).map((figure) => (
            <ChartFigure key={figure.src} {...figure} />
          ))}
        </section>
      )}
      {(article.sections || []).map((section) => (
        <section key={section.heading} style={{ marginTop: "2rem" }}>
          <h2>{section.heading}</h2>
          {section.bullets && (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
          {(section.paragraphs || []).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {(section.figures || []).map((figure) => (
            <ChartFigure key={figure.src} {...figure} />
          ))}
          {(section.claims || []).map((claim) => (
            <details key={claim.claim} style={{ marginTop: "1rem" }}>
              <summary>{claim.claim}</summary>
              <p>
                {labels.confidence}: {Math.round(claim.confidence * 100)}%
              </p>
              <ul>
                {(claim.evidence || []).map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      ))}

      {/* Player Performances */}
      {(article.player_notes || []).length > 0 && (
        <section style={{ marginTop: "4rem" }}>
          <h2 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            marginBottom: "2rem"
          }}>
            {labels.playerPerformances}
          </h2>
          <div className="grid grid-2">
            {(article.player_notes || []).map((note) => {
              const rating = parseFloat(note.rating);
              const isHome = article.match.homeTeam === note.team;
              const ratingColor = rating >= 7.5 ? "var(--color-success)" : rating >= 6.5 ? "var(--color-accent)" : "var(--color-text-muted)";

              return (
                <div
                  key={note.player}
                  className="card"
                  style={{
                    background: "linear-gradient(135deg, white 0%, var(--color-bg-alt) 100%)",
                    borderLeft: `4px solid ${isHome ? "var(--color-primary)" : "var(--color-secondary)"}`,
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem"
                  }}>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: "1.25rem",
                        fontWeight: 700
                      }}>
                        {note.player}
                      </h3>
                      <p style={{
                        margin: "0.25rem 0 0 0",
                        color: "var(--color-text-muted)",
                        fontSize: "0.9375rem"
                      }}>
                        {note.team}
                      </p>
                    </div>
                    <div style={{
                      padding: "0.5rem 1rem",
                      background: ratingColor,
                      color: "white",
                      borderRadius: "var(--radius-lg)",
                      fontWeight: 700,
                      fontSize: "1.125rem",
                    }}>
                      {note.rating}
                    </div>
                  </div>
                  <p style={{
                    marginBottom: "1rem",
                    fontSize: "1.0625rem",
                    lineHeight: 1.8
                  }}>
                    {note.summary}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                    {(note.evidence || []).map((evidence) => (
                      <li key={evidence} style={{
                        marginBottom: "0.5rem",
                        color: "var(--color-text-muted)"
                      }}>
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Data Limitations */}
      {(article.data_limitations || []).length > 0 && (
        <section style={{ marginTop: "4rem" }}>
          <div className="card" style={{
            background: "var(--color-bg-alt)",
            borderLeft: "4px solid var(--color-text-muted)"
          }}>
            <h2 style={{
              marginTop: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span>⚠️</span> {labels.dataLimitations}
            </h2>
            <ul style={{ marginBottom: 0 }}>
              {(article.data_limitations || []).map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: "4rem",
        paddingTop: "2rem",
        borderTop: "2px solid var(--color-border)"
      }}>
        <p style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          {article.cta}
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="/" className="btn btn-outline">
            {labels.backToMatches}
          </a>
          <a href="/about" className="btn btn-ghost">
            {labels.learnProcess}
          </a>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <p style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            fontWeight: 600
          }}>
            {labels.dataCitations}:
          </p>
          <ul style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {(article.data_citations || []).map((citation) => (
              <li key={citation}>{citation}</li>
            ))}
          </ul>
        </div>
      </footer>

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

function normalizeLanguage(lang: string | undefined): SupportedLanguage {
  if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  return "en";
}
