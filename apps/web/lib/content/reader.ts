import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { contentPaths, contentRoot } from "@/lib/paths";
import { normalizeLang, type Lang } from "@/i18n";
import sql from "@/lib/db";
import type { LeagueIndexContent, MatchArticle, MatchIndexEntry, SitePageContent } from "./types";

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ?? "https://assets.goalgazer.xyz";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  if (!(await fileExists(filePath))) {
    return null;
  }
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function readContentJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(contentRoot, relativePath);
  const raw = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

function ensureAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  // Replace old R2 domain with new custom domain if present
  let normalizedUrl = url;
  if (normalizedUrl.startsWith("https://pub-97ef9c6706fb4d328dd4f5c8ab4f8f1b.r2.dev")) {
    normalizedUrl = normalizedUrl.replace(
      "https://pub-97ef9c6706fb4d328dd4f5c8ab4f8f1b.r2.dev",
      R2_PUBLIC_URL
    );
  }

  if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://") || normalizedUrl.startsWith("/")) {
    return normalizedUrl;
  }
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${normalizedUrl.replace(/^\/+/, "")}`;
}

function normalizeArticleImages(article: MatchArticle) {
  const frontmatter = article.frontmatter ?? {};
  if (frontmatter.heroImage) {
    frontmatter.heroImage = ensureAbsoluteImageUrl(frontmatter.heroImage) ?? frontmatter.heroImage;
  }
  if (frontmatter.image) {
    frontmatter.image = ensureAbsoluteImageUrl(frontmatter.image) ?? frontmatter.image;
  }
  if (article.figures?.length) {
    article.figures = article.figures.map((figure) => ({
      ...figure,
      src: ensureAbsoluteImageUrl(figure.src) ?? figure.src,
    }));
  }
  if (article.sections?.length) {
    article.sections = article.sections.map((section) => ({
      ...section,
      figures: section.figures?.map((figure) => ({
        ...figure,
        src: ensureAbsoluteImageUrl(figure.src) ?? figure.src,
      })),
    }));
  }
}


// ... existing imports ... But I need to make sure I don't delete them if I use StartLine > 9?
// Ideally I should update imports first.
// Let's assume I can use "@/lib/db" if I update the top.

// REPLACING readMatchArticle, readMatchIndex, readMatchIndexLocalized, listMatchIds
// And helpers readMatchFile, readLegacyMatchFile which are now obsolete.

export async function readMatchArticle(
  matchSlugOrId: string,
  lang: string
): Promise<{ article: MatchArticle | null; resolvedLang: Lang; fallback: boolean }> {
  const normalizedLang = normalizeLang(lang);

  try {
    // Try requested language - Check slug first, then match_id
    const rows = await sql`
      SELECT mc.content, mc.slug, m.image 
      FROM match_content mc
      JOIN matches m ON mc.match_id = m.match_id
      WHERE (mc.slug = ${matchSlugOrId} OR mc.match_id = ${matchSlugOrId}) AND mc.lang = ${normalizedLang}
      LIMIT 1
    `;

    if (rows.length > 0) {
      const article = rows[0].content as MatchArticle;

      // Ensure article has valid structure
      if (!article || !article.frontmatter) {
        console.error(`Malformed article data for ${matchSlugOrId}`);
        return { article: null, resolvedLang: normalizedLang, fallback: false };
      }

      article.frontmatter.slug = rows[0].slug;
      if (rows[0].image) {
        article.frontmatter = {
          ...article.frontmatter,
          image: rows[0].image,
          heroImage: article.frontmatter.heroImage ?? rows[0].image,
        };
      }
      normalizeArticleImages(article);
      return {
        article,
        resolvedLang: normalizedLang,
        fallback: false
      };
    }

    // Fallback to English
    if (normalizedLang !== "en") {
      const fallbackRows = await sql`
        SELECT mc.content, mc.slug, m.image 
        FROM match_content mc
        JOIN matches m ON mc.match_id = m.match_id
        WHERE (mc.slug = ${matchSlugOrId} OR mc.match_id = ${matchSlugOrId}) AND mc.lang = 'en'
        LIMIT 1
      `;
      if (fallbackRows.length > 0) {
        const article = fallbackRows[0].content as MatchArticle;

        // Ensure article has valid structure
        if (!article || !article.frontmatter) {
          console.error(`Malformed fallback article data for ${matchSlugOrId}`);
          return { article: null, resolvedLang: "en", fallback: true };
        }

        article.frontmatter.slug = fallbackRows[0].slug;
        if (fallbackRows[0].image) {
          article.frontmatter = {
            ...article.frontmatter,
            image: fallbackRows[0].image,
            heroImage: article.frontmatter.heroImage ?? fallbackRows[0].image,
          };
        }
        normalizeArticleImages(article);
        return {
          article,
          resolvedLang: "en",
          fallback: true
        };
      }
    }
  } catch (e) {
    console.error(`DB Error reading match ${matchSlugOrId}:`, e);
  }

  return { article: null, resolvedLang: "en", fallback: true };
}

export interface MatchListOptions {
  lang?: string;
  league?: string;
  page?: number;
  limit?: number;
}

export async function readMatchIndex(options: MatchListOptions = {}): Promise<{ articles: MatchIndexEntry[]; total: number }> {
  const { lang, league, page = 1, limit = 10 } = options;
  const normalizedLang = lang ? normalizeLang(lang) : "en";
  const offset = (page - 1) * limit;

  try {
    // 1. Get Total Count
    let countRef;
    if (league) {
      const res = await sql`SELECT COUNT(*) as count FROM matches WHERE league = ${league}`;
      countRef = res;
    } else {
      const res = await sql`SELECT COUNT(*) as count FROM matches`;
      countRef = res;
    }
    const total = parseInt(countRef[0].count as string, 10);

    // 2. Get Data
    let query = sql`
      SELECT 
        m.match_id, 
        m.date_utc, 
        m.league, 
        m.home_team, 
        m.away_team, 
        m.score,
        m.image,
        COALESCE(mc.title, m.home_team || ' vs ' || m.away_team) as title,
        COALESCE(mc.description, '') as description,
        COALESCE(
          mc.slug, 
          LOWER(
            REGEXP_REPLACE(
              REGEXP_REPLACE(m.home_team || '-vs-' || m.away_team || '-' || m.match_id, '[^a-zA-Z0-9-]', '-', 'g'),
              '-+', '-', 'g'
            )
          )
        ) as slug
      FROM matches m
      LEFT JOIN match_content mc ON m.match_id = mc.match_id AND mc.lang = ${normalizedLang}
    `;

    if (league) {
      query = sql`${query} WHERE m.league = ${league}`;
    }

    query = sql`${query} ORDER BY m.date_utc DESC LIMIT ${limit} OFFSET ${offset}`;

    const rows = await query;

    const articles = rows.map(row => ({
      matchId: row.match_id,
      date: row.date_utc,
      league: row.league,
      title: row.title,
      description: row.description,
      slug: row.slug,
      teams: [row.home_team, row.away_team],
      image: ensureAbsoluteImageUrl(row.image)
    })) as MatchIndexEntry[];

    return { articles, total };

  } catch (e) {
    console.warn("DB Error reading match index:", e);
    return { articles: [], total: 0 };
  }
}

export async function readMatchIndexLocalized(lang: string): Promise<MatchIndexEntry[]> {
  const { articles } = await readMatchIndex({ lang, limit: 100 });
  return articles;
}



export async function readSitePage(slug: string, lang: string): Promise<SitePageContent | null> {
  const normalizedLang = normalizeLang(lang);
  const candidatePaths = [
    path.join(contentRoot, "pages", `${slug}.${normalizedLang}.json`),
    path.join(contentRoot, "pages", slug, `${normalizedLang}.json`),
    path.join(contentRoot, `${slug}.${normalizedLang}.json`),
    path.join(contentRoot, slug, `${normalizedLang}.json`),
  ];

  for (const candidate of candidatePaths) {
    const page = await readJsonIfExists<SitePageContent>(candidate);
    if (page) {
      return page;
    }
  }

  if (normalizedLang !== "en") {
    return readSitePage(slug, "en");
  }

  return null;
}

export async function readLeagueIndex(
  league: string,
  lang: string
): Promise<{ content: LeagueIndexContent | null; resolvedLang: Lang; fallback: boolean }> {
  const normalizedLang = normalizeLang(lang);
  const candidatePaths = [
    path.join(contentPaths.leagues, `${league}.${normalizedLang}.json`),
    path.join(contentPaths.leagues, league, `${normalizedLang}.json`),
  ];

  for (const candidate of candidatePaths) {
    const content = await readJsonIfExists<LeagueIndexContent>(candidate);
    if (content) {
      return { content, resolvedLang: normalizedLang, fallback: false };
    }
  }

  const legacyPath = path.join(contentPaths.leagues, `${league}.json`);
  const legacy = await readJsonIfExists<LeagueIndexContent>(legacyPath);
  if (legacy) {
    return {
      content: legacy,
      resolvedLang: normalizedLang,
      fallback: normalizedLang !== "en",
    };
  }

  if (normalizedLang !== "en") {
    return readLeagueIndex(league, "en");
  }

  return { content: null, resolvedLang: "en", fallback: true };
}

export async function listMatchIds(): Promise<string[]> {
  try {
    const rows = await sql`SELECT DISTINCT slug FROM match_content WHERE slug IS NOT NULL`;
    return rows.map(r => r.slug);
  } catch (e) {
    console.warn("DB Error listing matches:", e);
    return [];
  }
}
