import type { Metadata } from "next";
import { getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface EditorialPolicyProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: EditorialPolicyProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
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
    alternates: {
      canonical: buildCanonicalUrl(lang, "/editorial-policy"),
      languages: buildLanguageAlternates("/editorial-policy"),
    },
  };
}

export default async function EditorialPolicyPage({ params }: EditorialPolicyProps) {
  const lang = normalizeLang(params.lang);
  const { t, messages } = await getT(lang);

  return (
    <section className="card">
      <h1>{t("editorialPolicy.title")}</h1>
      {messages.editorialPolicy.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
