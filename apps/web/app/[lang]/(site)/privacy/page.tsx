import type { Metadata } from "next";
import { createTranslator, getMessages, normalizeLanguage } from "../../../i18n";

interface PrivacyPageProps {
  params: { lang: string };
}

export function generateMetadata({ params }: PrivacyPageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: messages.seo.pages.privacy.title,
    description: messages.seo.pages.privacy.description,
    openGraph: {
      title: messages.seo.pages.privacy.title,
      description: messages.seo.pages.privacy.description,
    },
    twitter: {
      title: messages.seo.pages.privacy.title,
      description: messages.seo.pages.privacy.description,
    },
  };
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);

  return (
    <section className="card">
      <h1>{t("privacy.title")}</h1>
      {messages.privacy.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
