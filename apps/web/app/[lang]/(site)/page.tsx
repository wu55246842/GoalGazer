import type { Metadata } from "next";
import { readMatchIndexLocalized } from "@/lib/content";
import { buildLocalizedPath, getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface HomePageProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
  return {
    title: messages.seo.pages.home.title,
    description: messages.seo.pages.home.description,
    openGraph: {
      title: messages.seo.pages.home.title,
      description: messages.seo.pages.home.description,
    },
    twitter: {
      title: messages.seo.pages.home.title,
      description: messages.seo.pages.home.description,
    },
    alternates: {
      canonical: buildCanonicalUrl(lang, "/"),
      languages: buildLanguageAlternates("/"),
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);
  const locale = messages.formats.locale;
  const articles = await readMatchIndexLocalized(lang);
  const matchLabel =
    articles.length === 1 ? t("home.matchLabelSingular") : t("home.matchLabelPlural");

  return (
    <div>
      <section className="hero">
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroDescription")}</p>
        <div className="flex justify-center gap-md" style={{ marginTop: "2rem" }}>
          <a href="#matches" className="btn btn-primary">
            {t("home.viewLatestMatches")}
          </a>
          <a href={buildLocalizedPath(lang, "/about")} className="btn btn-outline">
            {t("home.learnMore")}
          </a>
        </div>
      </section>

      <section id="matches">
        <div className="flex justify-between items-center mb-xl">
          <div>
            <h2 style={{ marginBottom: "0.5rem" }}>{t("home.latestTitle")}</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 0 }}>
              {t("home.matchCount", { count: articles.length, matchLabel })}
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="card text-center" style={{ padding: "3rem" }}>
            <h3>{t("home.noMatchesTitle")}</h3>
            <p>{t("home.noMatchesDescription")}</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {articles.map((article, index) => (
              <a
                key={article.matchId}
                href={buildLocalizedPath(lang, `/matches/${article.matchId}`)}
                className="card card-interactive fade-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  textDecoration: "none",
                }}
              >
                <div className="flex justify-between items-center mb-md">
                  <span className="tag">{article.league}</span>
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
        )}
      </section>

      <div className="ad-container" style={{ marginTop: "3rem" }}>
        <div className="ad-placeholder">{t("common.advertisement")}</div>
      </div>

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
