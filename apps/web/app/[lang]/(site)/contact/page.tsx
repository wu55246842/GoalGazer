import type { Metadata } from "next";
import { getT, normalizeLang } from "@/i18n";
import { buildCanonicalUrl, buildLanguageAlternates } from "@/lib/seo";

interface ContactPageProps {
  params: { lang: string };
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const lang = normalizeLang(params.lang);
  const { messages } = await getT(lang);
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
    alternates: {
      canonical: buildCanonicalUrl(lang, "/contact"),
      languages: buildLanguageAlternates("/contact"),
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const lang = normalizeLang(params.lang);
  const { t } = await getT(lang);

  return (
    <section className="card">
      <h1>{t("contact.title")}</h1>
      <p>
        {t("contact.intro")}
        <a href="mailto:wuliangtech0118@gmail.com">wuliangtech0118@gmail.com</a>
        {t("contact.introSuffix")}
      </p>
      <p>{t("contact.outro")}</p>
    </section>
  );
}
