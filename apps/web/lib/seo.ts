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
  const matchPath = article.frontmatter.slug ? `/matches/${article.frontmatter.slug}` : `/matches/${article.frontmatter.matchId}`;
  const canonical = buildCanonicalUrl(lang, matchPath);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(matchPath),
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
  const matchPath = article.frontmatter.slug ? `/matches/${article.frontmatter.slug}` : `/matches/${article.frontmatter.matchId}`;
  const url = buildCanonicalUrl(lang, matchPath);

  const getTeamName = (team: any) => {
    if (typeof team === 'string') return team;
    return team?.name || "Team";
  };

  const homeName = getTeamName(article.match?.homeTeam) || article.frontmatter.teams?.[0] || "Home Team";
  const awayName = getTeamName(article.match?.awayTeam) || article.frontmatter.teams?.[1] || "Away Team";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": article.frontmatter.title,
        "description": article.frontmatter.description,
        "datePublished": article.frontmatter.date,
        "inLanguage": lang,
        "author": {
          "@type": "Organization",
          "name": "GoalGazer"
        },
        "publisher": {
          "@type": "Organization",
          "name": "GoalGazer",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`
          }
        },
        "mainEntityOfPage": url,
        "about": { "@id": `${url}#event` }
      },
      {
        "@type": "SportsEvent",
        "@id": `${url}#event`,
        "name": `${homeName} vs ${awayName}`,
        "description": `Tactical analysis and match statistics for ${homeName} vs ${awayName}`,
        "startDate": article.frontmatter.date,
        "location": {
          "@type": "Place",
          "name": article.match?.venue || "Stadium"
        },
        "competitor": [
          {
            "@type": "SportsTeam",
            "name": homeName
          },
          {
            "@type": "SportsTeam",
            "name": awayName
          }
        ],
        "sport": "Soccer"
      }
    ]
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
        item: buildCanonicalUrl(lang, article.frontmatter.slug ? `/matches/${article.frontmatter.slug}` : `/matches/${article.frontmatter.matchId}`),
      },
    ],
  };
}
