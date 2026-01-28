import type { Metadata } from "next";
import { buildLocalizedPath, DEFAULT_LANG, SUPPORTED_LANGS, type Lang } from "@/i18n";
import type { MatchArticle } from "@/lib/content";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.goalgazer.example";

export function buildLanguageAlternates(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const entries = Object.fromEntries(
    SUPPORTED_LANGS.map((lang) => [lang, buildLocalizedPath(lang, normalized)])
  );
  return {
    ...entries,
    "x-default": buildLocalizedPath(DEFAULT_LANG, normalized),
  };
}

export function buildCanonicalUrl(lang: Lang, pathname: string) {
  const localized = buildLocalizedPath(lang, pathname);
  return new URL(localized, baseUrl).toString();
}

export function buildArticleMetadata(article: MatchArticle, lang: Lang): Metadata {
  const title = article.frontmatter.title;
  const description = article.frontmatter.description;
  const image = article.frontmatter.heroImage ?? article.sections?.[0]?.figures?.[0]?.src;
  const canonical = buildCanonicalUrl(lang, `/matches/${article.frontmatter.matchId}`);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(`/matches/${article.frontmatter.matchId}`),
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

export function buildJsonLd(article: MatchArticle, lang: Lang) {
  const url = buildCanonicalUrl(lang, `/matches/${article.frontmatter.matchId}`);
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
  article: MatchArticle,
  lang: Lang,
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
        item: buildCanonicalUrl(lang, "/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.frontmatter.league,
        item: buildCanonicalUrl(lang, `/leagues/${article.frontmatter.league}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.frontmatter.title,
        item: buildCanonicalUrl(lang, `/matches/${article.frontmatter.matchId}`),
      },
    ],
  };
}
