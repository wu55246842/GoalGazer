import type { Metadata } from "next";
import { readLeagueIndex, readMatchIndex, readMatchIndexLocalized } from "@/lib/content";
import { buildLocalizedPath, getT, normalizeLang, SUPPORTED_LANGS } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface LeaguePageProps {
  params: { lang: string; league: string };
}

export async function generateStaticParams() {
  const entries = await readMatchIndex();
  const leagues = Array.from(new Set(entries.map((entry) => entry.league)));
  return SUPPORTED_LANGS.flatMap((lang) => leagues.map((league) => ({ lang, league })));
}

export async function generateMetadata({ params }: LeaguePageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
  const leagueTitle = params.league.toUpperCase();
  return {
    title: `${leagueTitle} | ${messages.seo.pages.leagues.title}`,
    description: messages.seo.pages.leagues.description,
    alternates: {
      canonical: buildCanonicalUrl(lang, `/leagues/${params.league}`),
      languages: buildLanguageAlternates(`/leagues/${params.league}`),
    },
  };
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);
  const locale = messages.formats.locale;
  const entries = (await readMatchIndexLocalized(lang)).filter(
    (entry) => entry.league.toLowerCase() === params.league.toLowerCase()
  );
  const leagueContent = await readLeagueIndex(params.league, lang);

  return (
    <section>
      <h1>{t("leagues.title", { league: params.league.toUpperCase() })}</h1>
      {leagueContent.content?.description && <p>{leagueContent.content.description}</p>}
      {entries.length === 0 ? (
        <p>{t("leagues.empty")}</p>
      ) : (
        <div className="grid two">
          {entries.map((article) => (
            <a key={article.matchId} href={buildLocalizedPath(lang, `/matches/${article.matchId}`)}>
              <div className="card">
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <p>{new Date(article.date).toLocaleDateString(locale)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
