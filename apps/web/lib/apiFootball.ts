const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

export interface Fixture {
    fixture: {
        id: number;
        date: string;
        status: {
            long: string;
            short: string;
            elapsed: number;
        };
        venue: {
            name: string;
        };
    };
    league: {
        round: string;
    };
    teams: {
        home: { id: number; name: string; logo: string; winner: boolean | null };
        away: { id: number; name: string; logo: string; winner: boolean | null };
    };
    goals: {
        home: number | null;
        away: number | null;
    };
}

export interface Standing {
    rank: number;
    team: {
        id: number;
        name: string;
        logo: string;
    };
    points: number;
    goalsDiff: number;
    group: string;
    form: string;
    status: string;
    all: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
            for: number;
            against: number;
        };
    };
}

export interface PlayerStat {
    player: {
        id: number;
        name: string;
        photo: string;
    };
    statistics: Array<{
        team: {
            name: string;
            logo: string;
        };
        goals: {
            total: number | null;
            assists: number | null;
        };
        games: {
            appearences: number;
        };
    }>;
}

async function fetchFromApi<T>(endpoint: string, revalidate: number = 3600): Promise<T[]> {
    if (!API_KEY) {
        console.error("API_FOOTBALL_KEY is not defined");
        return [];
    }

    const url = `${BASE_URL}/${endpoint}`;
    try {
        const res = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY,
            },
            next: { revalidate },
        });

        if (!res.ok) {
            throw new Error(`API Request failed: ${res.statusText}`);
        }

        const data = await res.json();
        return data.response || [];
    } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        return [];
    }
}

export async function fetchFixtures(leagueId: number, season: number): Promise<Fixture[]> {
    // Cache fixtures for 15 minutes
    return fetchFromApi<Fixture>(`fixtures?league=${leagueId}&season=${season}`, 900);
}

export async function fetchStandings(leagueId: number, season: number): Promise<Standing[]> {
    // Cache standings for 12 hours
    const response = await fetchFromApi<any>(`standings?league=${leagueId}&season=${season}`, 43200);
    if (response.length > 0 && response[0].league?.standings) {
        return response[0].league.standings[0] || [];
    }
    return [];
}

export async function fetchTopScorers(leagueId: number, season: number): Promise<PlayerStat[]> {
    // Cache leaders for 12 hours
    return fetchFromApi<PlayerStat>(`players/topscorers?league=${leagueId}&season=${season}`, 43200);
}

export async function fetchTopAssists(leagueId: number, season: number): Promise<PlayerStat[]> {
    // Cache leaders for 12 hours
    return fetchFromApi<PlayerStat>(`players/topassists?league=${leagueId}&season=${season}`, 43200);
}
