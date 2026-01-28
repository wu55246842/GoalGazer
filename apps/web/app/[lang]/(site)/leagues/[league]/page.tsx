import type { Metadata } from "next";
import { loadIndex, loadIndexLocalized } from "../../../../lib/content";
import {
  buildLocalizedPath,
  createTranslator,
  getMessages,
  normalizeLanguage,
  supportedLanguages,
} from "../../../../i18n";

interface LeaguePageProps {
  params: { lang: string; league: string };
}

export async function generateStaticParams() {
  const leagues = Array.from(new Set(loadIndex().map((entry) => entry.league)));
  return supportedLanguages.flatMap((lang) => leagues.map((league) => ({ lang, league })));
}

export function generateMetadata({ params }: LeaguePageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: `${params.league.toUpperCase()} | ${messages.seo.pages.leagues.title}`,
    description: messages.seo.pages.leagues.description,
  };
}

export default function LeaguePage({ params }: LeaguePageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);
  const locale = messages.formats.locale;
  const entries = loadIndexLocalized(lang).filter(
    (entry) => entry.league.toLowerCase() === params.league.toLowerCase()
  );

  return (
    <section>
      <h1>{t("leagues.title", { league: params.league.toUpperCase() })}</h1>
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
