import type { Metadata } from "next";
import { createTranslator, getMessages, normalizeLanguage } from "../../../i18n";

interface ContactPageProps {
  params: { lang: string };
}

export function generateMetadata({ params }: ContactPageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: messages.seo.pages.contact.title,
    description: messages.seo.pages.contact.description,
    openGraph: {
      title: messages.seo.pages.contact.title,
      description: messages.seo.pages.contact.description,
    },
    twitter: {
      title: messages.seo.pages.contact.title,
      description: messages.seo.pages.contact.description,
    },
  };
}

export default function ContactPage({ params }: ContactPageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);
  const email = "hello@goalgazer.example";

  return (
    <section className="card">
      <h1>{t("contact.title")}</h1>
      <p>
        {t("contact.intro")}<a href={`mailto:${email}`}>{email}</a>
        {t("contact.introSuffix")}
      </p>
      <p>{t("contact.outro")}</p>
    </section>
  );
}
