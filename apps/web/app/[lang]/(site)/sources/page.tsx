import type { Metadata } from "next";
import { getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface SourcesPageProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: SourcesPageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
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
    alternates: {
      canonical: buildCanonicalUrl(lang, "/sources"),
      languages: buildLanguageAlternates("/sources"),
    },
  };
}

export default async function SourcesPage({ params }: SourcesPageProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);

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
