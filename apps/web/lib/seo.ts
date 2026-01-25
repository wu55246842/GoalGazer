import type { Metadata } from "next";
import type { ArticleContent } from "./content";

export function buildArticleMetadata(article: ArticleContent): Metadata {
  const title = article.frontmatter.title;
  const description = article.frontmatter.description;
  const image = article.frontmatter.heroImage ?? article.sections[0]?.figures[0]?.src;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
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

export function buildJsonLd(article: ArticleContent) {
  const url = `https://www.goalgazer.example/matches/${article.frontmatter.matchId}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.frontmatter.title,
    description: article.frontmatter.description,
    datePublished: article.frontmatter.date,
    mainEntityOfPage: url,
    author: {
      "@type": "Organization",
      name: "GoalGazer",
    },
  };
}

export function buildBreadcrumbJsonLd(article: ArticleContent) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.goalgazer.example",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.frontmatter.league,
        item: `https://www.goalgazer.example/leagues/${article.frontmatter.league}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.frontmatter.title,
        item: `https://www.goalgazer.example/matches/${article.frontmatter.matchId}`,
      },
    ],
  };
}
