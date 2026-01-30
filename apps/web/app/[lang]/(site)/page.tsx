import type { Metadata } from "next";
import { readMatchIndexLocalized, readMatchIndex } from "@/lib/content";
import { buildLocalizedPath, getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";
import AdUnit from "@/components/AdUnit";

const LEAGUES = [
  { id: 'all' },
  { id: 'epl' },
  { id: 'laliga' },
  { id: 'bundesliga' },
  { id: 'seriea' },
  { id: 'ligue1' },
];

const LEAGUE_DB_MAP: Record<string, string> = {
  epl: 'premier-league',
  laliga: 'la-liga',
  bundesliga: 'bundesliga',
  seriea: 'serie-a',
  ligue1: 'ligue-1'
};

interface HomePageProps {
  params: { lang: string };
  searchParams: { league?: string; page?: string };
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);
  const locale = messages.formats.locale;

  const currentLeagueId = searchParams.league || 'all';
  const dbLeague = currentLeagueId === 'all' ? undefined : (LEAGUE_DB_MAP[currentLeagueId] || currentLeagueId);
  const currentPage = parseInt(searchParams.page || '1', 10);
  const limit = 12;

  const { articles, total } = await readMatchIndex({ // Note: readMatchIndex is now imported from @/lib/content via index.ts or direct
    lang,
    league: dbLeague,
    page: currentPage,
    limit
  });

  const totalPages = Math.ceil(total / limit);
  const matchLabel =
    articles.length === 1 ? t("home.matchLabelSingular") : t("home.matchLabelPlural");

  return (
    <div>
      <section className="hero">
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroDescription")}</p>
        <div className="flex justify-center gap-md" style={{ marginTop: "2rem" }}>
          <a href={buildLocalizedPath(lang, "/daily")} className="btn btn-primary" style={{ background: 'linear-gradient(to right, #10b981, #3b82f6)', border: 'none' }}>
            {t("nav.daily")}
          </a>
          <a href="#matches" className="btn btn-outline">
            {t("home.viewLatestMatches")}
          </a>
        </div>
      </section>

      <section id="matches">
        <div className="match-header">
          <div>
            <h2 style={{ marginBottom: "0.5rem" }}>{t("home.latestTitle")}</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 0 }}>
              {t("home.matchCount", { count: total, matchLabel })}
            </p>
          </div>

          <div className="league-tabs">
            {LEAGUES.map((league) => {
              const isActive = currentLeagueId === league.id;
              const href = buildLocalizedPath(lang, "/") + (league.id === 'all' ? '' : `?league=${league.id}`);
              return (
                <a
                  key={league.id}
                  href={href}
                  className={`league-tab ${isActive ? 'active' : ''}`}
                >
                  {/* @ts-ignore */}
                  {t(`leagueNames.${league.id}`)}
                </a>
              );
            })}
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="card text-center" style={{ padding: "3rem" }}>
            <h3>{t("home.noMatchesTitle")}</h3>
            <p>{t("home.noMatchesDescription")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-2">
              {articles.map((article, index) => (
                <a
                  key={article.matchId}
                  href={buildLocalizedPath(lang, `/matches/${article.slug}`)}
                  className="card card-interactive fade-in"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    textDecoration: "none",
                  }}
                >
                  {article.image && (
                    <div className="card-image-container" style={{ margin: "-1.5rem -1.5rem 1.5rem", borderRadius: "1rem 1rem 0 0", overflow: "hidden", height: "200px" }}>
                      <img src={article.image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-md">
                    <span className="tag capitalize">{article.league}</span>
                    <time
                      dateTime={article.date}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-light)",
                      }}
                    >
                      {new Date(article.date).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <h3
                    style={{
                      marginBottom: "0.75rem",
                      fontSize: "1.25rem",
                      color: "var(--color-text)",
                    }}
                  >
                    {article.title}
                  </h3>

                  <p
                    style={{
                      color: "var(--color-text-muted)",
                      lineHeight: 1.6,
                      marginBottom: "1rem",
                    }}
                  >
                    {article.description}
                  </p>

                  <div
                    className="flex items-center gap-sm"
                    style={{
                      color: "var(--color-primary)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                    }}
                  >
                    {t("home.readAnalysis")}
                    <span style={{ fontSize: "1.125rem" }}>→</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8" style={{ marginTop: '2rem' }}>
                {currentPage > 1 && (
                  <a
                    href={`${buildLocalizedPath(lang, "/")}?${new URLSearchParams({
                      ...(currentLeagueId !== 'all' ? { league: currentLeagueId } : {}),
                      page: (currentPage - 1).toString()
                    }).toString()}`}
                    className="btn btn-outline"
                  >
                    Select Previous
                  </a>
                )}
                <span className="text-text-muted" style={{ marginRight: "1.5rem" }}>
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <a
                    href={`${buildLocalizedPath(lang, "/")}?${new URLSearchParams({
                      ...(currentLeagueId !== 'all' ? { league: currentLeagueId } : {}),
                      page: (currentPage + 1).toString()
                    }).toString()}`}
                    className="btn btn-outline ml-2"
                  >
                    Next
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <AdUnit slot="7462283941" />

      <section
        className="card text-center"
        style={{
          marginTop: "3rem",
          background:
            "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary-light) 100%)",
          border: "none",
        }}
      >
        <h2>{t("home.ctaTitle")}</h2>
        <p style={{ maxWidth: "600px", margin: "0 auto 1.5rem" }}>
          {t("home.ctaDescription")}
        </p>
        <a href={buildLocalizedPath(lang, "/contact")} className="btn btn-primary">
          {t("home.getInTouch")}
        </a>
      </section>
    </div>
  );
}
