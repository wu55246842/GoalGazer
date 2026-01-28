import type { Metadata } from "next";
import { createTranslator, getMessages, normalizeLanguage } from "../../../i18n";

interface SourcesPageProps {
  params: { lang: string };
}

export function generateMetadata({ params }: SourcesPageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: messages.seo.pages.sources.title,
    description: messages.seo.pages.sources.description,
    openGraph: {
      title: messages.seo.pages.sources.title,
      description: messages.seo.pages.sources.description,
    },
    twitter: {
      title: messages.seo.pages.sources.title,
      description: messages.seo.pages.sources.description,
    },
  };
}

export default function SourcesPage({ params }: SourcesPageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);

  return (
    <section className="card">
      <h1>{t("sources.title")}</h1>
      <p>{t("sources.intro")}</p>
      <ul>
        {messages.sources.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{t("sources.outro")}</p>
    </section>
  );
}
