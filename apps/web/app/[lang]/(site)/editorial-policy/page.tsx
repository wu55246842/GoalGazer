import type { Metadata } from "next";
import { createTranslator, getMessages, normalizeLanguage } from "../../../i18n";

interface EditorialPolicyPageProps {
  params: { lang: string };
}

export function generateMetadata({ params }: EditorialPolicyPageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: messages.seo.pages.editorialPolicy.title,
    description: messages.seo.pages.editorialPolicy.description,
    openGraph: {
      title: messages.seo.pages.editorialPolicy.title,
      description: messages.seo.pages.editorialPolicy.description,
    },
    twitter: {
      title: messages.seo.pages.editorialPolicy.title,
      description: messages.seo.pages.editorialPolicy.description,
    },
  };
}

export default function EditorialPolicyPage({ params }: EditorialPolicyPageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);

  return (
    <section className="card">
      <h1>{t("editorialPolicy.title")}</h1>
      {messages.editorialPolicy.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
