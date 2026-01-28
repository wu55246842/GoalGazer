import type { Metadata } from "next";
import { getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface AboutPageProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
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
    alternates: {
      canonical: buildCanonicalUrl(lang, "/about"),
      languages: buildLanguageAlternates("/about"),
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);

  return (
    <section className="card">
      <h1>{t("about.title")}</h1>
      {messages.about.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
