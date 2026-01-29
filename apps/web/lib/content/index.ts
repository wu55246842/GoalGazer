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

export interface MatchArticle {
  frontmatter: {
    title: string;
    description: string;
    date: string;
    matchId: string;
    league: string;
    teams: string[];
    tags: string[];
    heroImage?: string | null;
    image?: string;
  };
  match: {
    id: string;
    date_utc: string;
    league: string;
    season?: string;
    round?: string | null;
    homeTeam: { id?: string; name: string } | string;
    awayTeam: { id?: string; name: string } | string;
    score: { home: number; away: number; ht_home?: number; ht_away?: number } | string;
    venue?: string | null;
  };
  timeline?: Array<Record<string, unknown>>;
  team_stats?: Record<string, unknown>;
  players?: Array<Record<string, unknown>>;
  figures?: FigureMeta[];
  sections?: ArticleSection[];
  player_notes?: {
    player: string;
    team: string;
    summary: string;
    evidence: string[];
    rating?: string | null;
  }[];
  data_limitations?: string[];
  cta?: string;
  data_citations?: string[];
  data_provenance?: Record<string, unknown>;
}

export interface MatchIndexEntry {
  title: string;
  description: string;
  date: string;
  matchId: string;
  slug: string;
  teams: string[];
  league: string;
  image?: string;
}

export interface SitePageContent {
  slug: string;
  title: string;
  description?: string;
  sections?: Array<{
    heading?: string;
    paragraphs?: string[];
    bullets?: string[];
  }>;
}

export interface LeagueIndexContent {
  league: string;
  title?: string;
  description?: string;
  highlights?: string[];
  matches?: string[];
}

export {
  listMatchIds,
  readContentJson,
  readLeagueIndex,
  readMatchArticle,
  readMatchIndex,
  readMatchIndexLocalized,
  readSitePage,
} from "@/lib/content/reader";
