import type { Metadata } from "next";
import { createTranslator, getMessages, normalizeLanguage } from "../../../i18n";

interface AboutPageProps {
  params: { lang: string };
}

export function generateMetadata({ params }: AboutPageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: messages.seo.pages.about.title,
    description: messages.seo.pages.about.description,
    openGraph: {
      title: messages.seo.pages.about.title,
      description: messages.seo.pages.about.description,
    },
    twitter: {
      title: messages.seo.pages.about.title,
      description: messages.seo.pages.about.description,
    },
  };
}

export default function AboutPage({ params }: AboutPageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);

  return (
    <section className="card">
      <h1>{t("about.title")}</h1>
      {messages.about.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
