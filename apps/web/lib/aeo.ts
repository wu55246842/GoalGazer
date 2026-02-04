import { buildLocalizedPath, normalizeLang, type Lang } from "@/i18n";
import sql from "@/lib/db";
import type { MatchArticle } from "@/lib/content";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://assets.goalgazer.xyz";
const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.goalgazer.example";

export function resolveBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(request.url).protocol.replace(":", "");
  return `${protocol}://${host}`.replace(/\/$/, "");
}

export function buildMatchUrl(baseUrl: string, lang: Lang, slugOrId: string): string {
  const path = buildLocalizedPath(lang, `/matches/${slugOrId}`);
  return new URL(path, baseUrl).toString();
}

export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}${url}`;
  }
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${url.replace(/^\/+/, "")}`;
}

export function buildAeoMatchPayload(
  article: MatchArticle,
  baseUrl: string,
  lang: Lang
): Record<string, unknown> {
  const slug = article.frontmatter.slug ?? article.frontmatter.matchId;
  const url = buildMatchUrl(baseUrl, lang, slug);
  const summary = article.frontmatter.description;
  const figures = article.figures ?? [];

  return {
    type: "match",
    id: article.frontmatter.matchId,
    slug,
    lang,
    league: article.frontmatter.league,
    title: article.frontmatter.title,
    description: summary,
    date: article.frontmatter.date,
    teams: article.frontmatter.teams,
    score: article.match?.score ?? null,
    url,
    heroImage: normalizeImageUrl(article.frontmatter.heroImage ?? article.frontmatter.image),
    sections: article.sections?.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs,
      bullets: section.bullets ?? [],
      claims: section.claims ?? [],
    })),
    figures: figures.map((figure) => ({
      id: figure.id,
      src: normalizeImageUrl(figure.src),
      alt: figure.alt,
      caption: figure.caption,
      kind: figure.kind,
    })),
    playerNotes: article.player_notes ?? [],
    dataLimitations: article.data_limitations ?? [],
    dataCitations: article.data_citations ?? [],
    dataProvenance: article.data_provenance ?? {},
    cta: article.cta ?? null,
  };
}

export interface SearchMatchParams {
  query: string;
  lang?: string | null;
  limit?: number | null;
}

export async function searchMatches({
  query,
  lang,
  limit,
}: SearchMatchParams): Promise<Record<string, unknown>[]> {
  const normalizedLang = normalizeLang(lang ?? undefined);
  const safeLimit = Math.min(Math.max(limit ?? 10, 1), 25);
  const like = `%${query}%`;

  const rows = await sql`
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
    WHERE m.home_team ILIKE ${like}
      OR m.away_team ILIKE ${like}
      OR mc.title ILIKE ${like}
      OR mc.description ILIKE ${like}
    ORDER BY m.date_utc DESC
    LIMIT ${safeLimit}
  `;

  return rows.map((row) => ({
    matchId: row.match_id,
    date: row.date_utc,
    league: row.league,
    title: row.title,
    description: row.description,
    slug: row.slug,
    teams: [row.home_team, row.away_team],
    score: row.score,
    image: normalizeImageUrl(row.image),
  }));
}

export interface DailyDigestParams {
  date: string;
  lang?: string | null;
  league?: string | null;
}

export async function fetchDailyDigest({
  date,
  lang,
  league,
}: DailyDigestParams): Promise<Record<string, unknown> | null> {
  const normalizedLang = normalizeLang(lang ?? undefined);
  const requestedLeague = league ?? "epl";

  let [digest] = await sql`
    SELECT *
    FROM daily_digests
    WHERE date_str = ${date} AND lang = ${normalizedLang} AND league = ${requestedLeague}
    LIMIT 1
  `;

  if (!digest && requestedLeague === "epl") {
    [digest] = await sql`
      SELECT *
      FROM daily_digests
      WHERE date_str = ${date} AND lang = ${normalizedLang}
      LIMIT 1
    `;
  }

  if (!digest) {
    return null;
  }

  let matchHighlights: Record<string, unknown>[] = [];
  if (digest.match_ids && Array.isArray(digest.match_ids) && digest.match_ids.length > 0) {
    matchHighlights = await sql`
      SELECT m.match_id, m.home_team, m.away_team, m.score, mc.slug, mc.content->>'image' as image, mc.content->>'title' as title
      FROM matches m
      JOIN match_content mc ON m.match_id = mc.match_id
      WHERE m.match_id IN ${sql(digest.match_ids)} AND mc.lang = ${normalizedLang}
    `;
  }

  return {
    ...digest,
    lang: normalizedLang,
    matchHighlights: matchHighlights.map((match) => ({
      matchId: match.match_id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      score: match.score,
      slug: match.slug,
      title: match.title,
      image: normalizeImageUrl(match.image as string | undefined),
    })),
  };
}

export function buildSiteOverview(baseUrl: string): Record<string, unknown> {
  return {
    name: "GoalGazer",
    description: "AI-assisted football tactical recaps with structured evidence and visualizations.",
    baseUrl,
    languages: ["en", "zh", "ja"],
    contentTypes: ["match_recaps", "daily_digests", "league_dashboards"],
    endpoints: {
      site: `${baseUrl}/api/aeo/site`,
      search: `${baseUrl}/api/aeo/search?q={query}`,
      match: `${baseUrl}/api/aeo/match/{slug}`,
      daily: `${baseUrl}/api/aeo/daily/{date}?league=epl&lang=en`,
      mcp: `${baseUrl}/api/mcp`,
      llms: `${baseUrl}/llms.txt`,
    },
  };
}

export function getDefaultSiteUrl(): string {
  return DEFAULT_SITE_URL.replace(/\/$/, "");
}
