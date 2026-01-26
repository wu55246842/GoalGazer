// TypeScript Schema Definitions for GoalGazer A-Tier

export interface MatchAData {
    match: {
        id: string;
        date_utc: string;
        league: { id: number; name: string; season: number };
        home: { id: number; name: string };
        away: { id: number; name: string };
        score: { home: number; away: number };
        venue: string;
    };
    team_stats: {
        home: TeamStats;
        away: TeamStats;
    };
    shots: Shot[];
    limitations: string[];
}

export interface TeamStats {
    possession: number;
    shots_total: number;
    shots_on: number;
    corners: number;
    fouls: number;
    yellow: number;
    red: number;
}

export interface Shot {
    team: "home" | "away";
    player: string | null;
    minute: number;
    extra: number;
    outcome: "Goal" | "Saved" | "Off Target" | "Blocked" | "Woodwork" | "Unknown";
    x: number;
    y: number;
    has_location: boolean;
}

export interface FigureMeta {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
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
