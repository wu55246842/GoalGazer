import type { Metadata } from "next";
import { buildLocalizedPath, getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface TermsPageProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
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
    alternates: {
      canonical: buildCanonicalUrl(lang, "/terms"),
      languages: buildLanguageAlternates("/terms"),
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);

  return (
    <section className="card">
      <h1>{t("terms.title")}</h1>
      <p>{t("terms.lastUpdated", { date: "2024-05-01" })}</p>
      {messages.terms.sections.map((section) => (
        <section key={section.title} style={{ marginTop: "2rem" }}>
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
        </section>
      ))}
      <div style={{ marginTop: "2rem" }}>
        <p>
          <strong>{t("terms.contactEmailLabel")}</strong> wuliangtech0118@gmail.com
        </p>
        <p>
          <strong>{t("terms.questionsTitle")}</strong> {t("terms.questionsBody")}
          <a href={buildLocalizedPath(lang, "/contact")}>{t("terms.questionsLinkText")}</a>
          {t("terms.questionsSuffix")}
        </p>
      </div>
    </section>
  );
}
