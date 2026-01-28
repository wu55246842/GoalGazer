import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { contentPaths, contentRoot, generatedContentPaths } from "@/lib/paths";
import { normalizeLang, type Lang } from "@/i18n";
import type { LeagueIndexContent, MatchArticle, MatchIndexEntry, SitePageContent } from "@/lib/content";

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

async function readMatchFile(matchId: string, lang: Lang): Promise<MatchArticle | null> {
  const generatedPath = generatedContentPaths.matchContentFile(matchId, lang);
  const generated = await readJsonIfExists<MatchArticle>(generatedPath);
  if (generated) {
    return generated;
  }

  const directPath = path.join(contentPaths.matches, `${matchId}.${lang}.json`);
  const direct = await readJsonIfExists<MatchArticle>(directPath);
  if (direct) {
    return direct;
  }

  const nestedPath = path.join(contentPaths.matches, matchId, `${lang}.json`);
  const nested = await readJsonIfExists<MatchArticle>(nestedPath);
  if (nested) {
    return nested;
  }

  const flatPath = path.join(contentPaths.matches, `${matchId}.json`);
  const flat = await readJsonIfExists<MatchArticle>(flatPath);
  if (flat) {
    return flat;
  }

  return null;
}

async function readLegacyMatchFile(matchId: string): Promise<MatchArticle | null> {
  if (!(await fileExists(contentPaths.matches))) {
    return null;
  }
  const entries = await fs.readdir(contentPaths.matches);
  const target = entries.find((entry) => entry.endsWith(`_${matchId}.json`));
  if (!target) {
    return null;
  }
  const raw = await fs.readFile(path.join(contentPaths.matches, target), "utf-8");
  return JSON.parse(raw) as MatchArticle;
}

export async function readMatchArticle(
  matchId: string,
  lang: string
): Promise<{ article: MatchArticle | null; resolvedLang: Lang; fallback: boolean }> {
  const normalizedLang = normalizeLang(lang);
  const requested = await readMatchFile(matchId, normalizedLang);
  if (requested) {
    return { article: requested, resolvedLang: normalizedLang, fallback: false };
  }

  const fallbackLang: Lang = "en";
  const fallback = await readMatchFile(matchId, fallbackLang);
  if (fallback) {
    return {
      article: fallback,
      resolvedLang: fallbackLang,
      fallback: normalizedLang !== fallbackLang,
    };
  }

  const legacy = await readLegacyMatchFile(matchId);
  return {
    article: legacy,
    resolvedLang: "en",
    fallback: true,
  };
}

export async function readMatchIndex(): Promise<MatchIndexEntry[]> {
  if (!(await fileExists(contentPaths.index))) {
    return [];
  }
  const raw = await fs.readFile(contentPaths.index, "utf-8");
  return JSON.parse(raw) as MatchIndexEntry[];
}

export async function readMatchIndexLocalized(lang: string): Promise<MatchIndexEntry[]> {
  const entries = await readMatchIndex();
  const localized = await Promise.all(
    entries.map(async (entry) => {
      const { article } = await readMatchArticle(entry.matchId, lang);
      if (!article) {
        return entry;
      }
      return {
        ...entry,
        title: article.frontmatter.title || entry.title,
        description: article.frontmatter.description || entry.description,
        date: article.frontmatter.date || entry.date,
        league: article.frontmatter.league || entry.league,
        teams: article.frontmatter.teams || entry.teams,
        matchId: article.frontmatter.matchId || entry.matchId,
      };
    })
  );

  return localized;
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
  const entries = await readMatchIndex();
  if (entries.length > 0) {
    return entries.map((entry) => entry.matchId);
  }

  if (!(await fileExists(contentPaths.matches))) {
    return [];
  }
  const files = await fs.readdir(contentPaths.matches);
  return files
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => entry.split("_").pop()?.replace(".json", "") ?? "");
}
