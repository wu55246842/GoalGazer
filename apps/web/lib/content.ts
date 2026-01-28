import fs from "fs";
import path from "path";
import { contentPaths, generatedContentPaths } from "./paths";
import { normalizeLanguage } from "../i18n";

export interface FigureMeta {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  figures: FigureMeta[];
  bullets?: string[];
  claims?: {
    claim: string;
    evidence: string[];
    confidence: number;
  }[];
}

export interface ArticleContent {
  frontmatter: {
    title: string;
    description: string;
    date: string;
    matchId: string;
    league: string;
    teams: string[];
    tags: string[];
    heroImage?: string | null;
  };
  match: {
    id: string;
    date_utc: string;
    league: string;
    season: string;
    round?: string | null;
    homeTeam: { id?: string; name: string } | string;
    awayTeam: { id?: string; name: string } | string;
    score: { home: number; away: number; ht_home?: number; ht_away?: number } | string;
    venue?: string | null;
  };
  figures?: FigureMeta[];
  sections: ArticleSection[];
  player_notes: {
    player: string;
    team: string;
    summary: string;
    evidence: string[];
    rating?: string | null;
  }[];
  data_limitations: string[];
  data_citations?: string[];
  cta: string;
}

export interface ArticleIndexEntry {
  title: string;
  description: string;
  date: string;
  matchId: string;
  slug: string;
  teams: string[];
  league: string;
}

export function loadIndex(): ArticleIndexEntry[] {
  if (!fs.existsSync(contentPaths.index)) {
    return [];
  }
  const raw = fs.readFileSync(contentPaths.index, "utf-8");
  return JSON.parse(raw) as ArticleIndexEntry[];
}

export function loadIndexLocalized(lang: string): ArticleIndexEntry[] {
  const entries = loadIndex();
  return entries.map((entry) => {
    const { article } = loadArticleLocalized(entry.matchId, lang);
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
  });
}

export function loadArticle(matchId: string): ArticleContent | null {
  if (!fs.existsSync(contentPaths.matches)) {
    return null;
  }
  const entries = fs.readdirSync(contentPaths.matches);
  const target = entries.find((entry) => entry.endsWith(`_${matchId}.json`));
  if (!target) {
    return null;
  }
  const raw = fs.readFileSync(path.join(contentPaths.matches, target), "utf-8");
  return JSON.parse(raw) as ArticleContent;
}

export function loadArticleLocalized(
  matchId: string,
  lang: string
): { article: ArticleContent | null; resolvedLang: string; fallback: boolean } {
  const normalizedLang = normalizeLanguage(lang);
  const requestedPath = generatedContentPaths.matchContentFile(matchId, normalizedLang);
  if (fs.existsSync(requestedPath)) {
    const raw = fs.readFileSync(requestedPath, "utf-8");
    return {
      article: JSON.parse(raw) as ArticleContent,
      resolvedLang: normalizedLang,
      fallback: false,
    };
  }

  const fallbackPath = generatedContentPaths.matchContentFile(matchId, "en");
  if (fs.existsSync(fallbackPath)) {
    const raw = fs.readFileSync(fallbackPath, "utf-8");
    return {
      article: JSON.parse(raw) as ArticleContent,
      resolvedLang: "en",
      fallback: normalizedLang !== "en",
    };
  }

  return { article: loadArticle(matchId), resolvedLang: "en", fallback: true };
}

export function listMatchIds(): string[] {
  if (!fs.existsSync(contentPaths.matches)) {
    return [];
  }
  const entries = fs
    .readdirSync(contentPaths.matches)
    .filter((entry) => entry.endsWith(".json"));
  return entries.map((entry) => entry.split("_").pop()?.replace(".json", "") ?? "");
}
