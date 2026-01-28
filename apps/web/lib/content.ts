import fs from "fs";
import path from "path";
import { contentPaths } from "./paths";

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
    round: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    venue: string;
  };
  figures?: FigureMeta[];
  sections: ArticleSection[];
  player_notes: {
    player: string;
    team: string;
    summary: string;
    evidence: string[];
    rating: string;
  }[];
  data_limitations: string[];
  data_citations: string[];
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

export function listMatchIds(): string[] {
  if (!fs.existsSync(contentPaths.matches)) {
    return [];
  }
  const entries = fs
    .readdirSync(contentPaths.matches)
    .filter((entry) => entry.endsWith(".json"));
  return entries.map((entry) => entry.split("_").pop()?.replace(".json", "") ?? "");
}
