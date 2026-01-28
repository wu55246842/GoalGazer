import type { Metadata } from "next";
import type { ArticleContent } from "./content";
import type { SupportedLanguage } from "../i18n";

const baseUrl = "https://www.goalgazer.example";

export function buildArticleMetadata(article: ArticleContent, lang: SupportedLanguage): Metadata {
  const title = article.frontmatter.title;
  const description = article.frontmatter.description;
  const image = article.frontmatter.heroImage ?? article.sections[0]?.figures[0]?.src;
  const canonical = `${baseUrl}/${lang}/matches/${article.frontmatter.matchId}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${baseUrl}/en/matches/${article.frontmatter.matchId}`,
        zh: `${baseUrl}/zh/matches/${article.frontmatter.matchId}`,
        ja: `${baseUrl}/ja/matches/${article.frontmatter.matchId}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildJsonLd(article: ArticleContent, lang: SupportedLanguage) {
  const url = `${baseUrl}/${lang}/matches/${article.frontmatter.matchId}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.frontmatter.title,
    description: article.frontmatter.description,
    datePublished: article.frontmatter.date,
    mainEntityOfPage: url,
    inLanguage: lang,
    author: {
      "@type": "Organization",
      name: "GoalGazer",
    },
  };
}

export function buildBreadcrumbJsonLd(
  article: ArticleContent,
  lang: SupportedLanguage,
  labels: { home: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.home,
        item: `${baseUrl}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.frontmatter.league,
        item: `${baseUrl}/${lang}/leagues/${article.frontmatter.league}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.frontmatter.title,
        item: `${baseUrl}/${lang}/matches/${article.frontmatter.matchId}`,
      },
    ],
  };
}
