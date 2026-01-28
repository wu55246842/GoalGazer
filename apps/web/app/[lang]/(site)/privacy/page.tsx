import type { Metadata } from "next";
import { getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface PrivacyPageProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
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
    alternates: {
      canonical: buildCanonicalUrl(lang, "/privacy"),
      languages: buildLanguageAlternates("/privacy"),
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);

  return (
    <section className="card">
      <h1>{t("privacy.title")}</h1>
      {messages.privacy.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
