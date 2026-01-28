import type { Metadata } from "next";
import { buildLocalizedPath, createTranslator, getMessages, normalizeLanguage } from "../../../i18n";

interface TermsPageProps {
  params: { lang: string };
}

export function generateMetadata({ params }: TermsPageProps): Metadata {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  return {
    title: messages.seo.pages.terms.title,
    description: messages.seo.pages.terms.description,
    openGraph: {
      title: messages.seo.pages.terms.title,
      description: messages.seo.pages.terms.description,
    },
    twitter: {
      title: messages.seo.pages.terms.title,
      description: messages.seo.pages.terms.description,
    },
  };
}

export default function TermsPage({ params }: TermsPageProps) {
  const lang = normalizeLanguage(params.lang);
  const messages = getMessages(lang);
  const t = createTranslator(messages, lang);
  const locale = messages.formats.locale;
  const formattedDate = new Date().toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>{t("terms.title")}</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "1.125rem", marginBottom: "2rem" }}>
        {t("terms.lastUpdated", { date: formattedDate })}
      </p>

      {messages.terms.sections.map((section) => (
        <section key={section.title} style={{ marginBottom: "3rem" }}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets && (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
          {section.title.startsWith("10.") && (
            <p style={{ marginTop: "1rem" }}>
              <strong>{t("terms.contactEmailLabel")}</strong>{" "}
              <a href="mailto:contact@goalgazer.example">contact@goalgazer.example</a>
            </p>
          )}
        </section>
      ))}

      <div
        style={{
          marginTop: "4rem",
          padding: "2rem",
          background: "var(--color-bg-alt)",
          borderRadius: "var(--radius-lg)",
          borderLeft: "4px solid var(--color-primary)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>{t("terms.questionsTitle")}</h3>
        <p style={{ marginBottom: 0 }}>
          {t("terms.questionsBody")}
          <a href={buildLocalizedPath(lang, "/contact")}>{t("terms.questionsLinkText")}</a>
          {t("terms.questionsSuffix")}
        </p>
      </div>
    </div>
  );
}
