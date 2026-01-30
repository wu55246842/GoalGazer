export interface LeagueConfig {
    id: number;
    slug: string;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
}

export const SUPPORTED_LEAGUES: Record<string, LeagueConfig> = {
    epl: {
        id: 39,
        slug: "epl",
        name: "Premier League",
        country: "England",
        logo: "https://media.api-sports.io/football/leagues/39.png",
        flag: "https://media.api-sports.io/flags/gb.svg",
        season: 2023,
    },
    liga: {
        id: 140,
        slug: "liga",
        name: "La Liga",
        country: "Spain",
        logo: "https://media.api-sports.io/football/leagues/140.png",
        flag: "https://media.api-sports.io/flags/es.svg",
        season: 2023,
    },
    bundesliga: {
        id: 78,
        slug: "bundesliga",
        name: "Bundesliga",
        country: "Germany",
        logo: "https://media.api-sports.io/football/leagues/78.png",
        flag: "https://media.api-sports.io/flags/de.svg",
        season: 2023,
    },
    seriea: {
        id: 135,
        slug: "seriea",
        name: "Serie A",
        country: "Italy",
        logo: "https://media.api-sports.io/football/leagues/135.png",
        flag: "https://media.api-sports.io/flags/it.svg",
        season: 2023,
    },
    ligue1: {
        id: 61,
        slug: "ligue1",
        name: "Ligue 1",
        country: "France",
        logo: "https://media.api-sports.io/football/leagues/61.png",
        flag: "https://media.api-sports.io/flags/fr.svg",
        season: 2023,
    },
    ucl: {
        id: 2,
        slug: "ucl",
        name: "UEFA Champions League",
        country: "World",
        logo: "https://media.api-sports.io/football/leagues/2.png",
        flag: "https://media.api-sports.io/flags/world.svg",
        season: 2023,
    },
};

export function getLeagueBySlug(slug: string): LeagueConfig | undefined {
    return SUPPORTED_LEAGUES[slug.toLowerCase()];
}

export function getAllLeagues(): LeagueConfig[] {
    return Object.values(SUPPORTED_LEAGUES);
}
