import { notFound } from "next/navigation";
import sql from "@/lib/db";
import { getT, normalizeLang } from "@/i18n";
import DailyDigestView from "@/components/DailyDigestView";
import SocialShare from "@/components/SocialShare";
import { Metadata } from "next";

interface Props {
    params: { lang: string; date: string };
}

export async function generateMetadata({ params: { lang, date }, searchParams }: Props & { searchParams: { league?: string } }): Promise<Metadata> {
    const normalizedLang = normalizeLang(lang);
    const requestedLeague = searchParams.league || 'epl';

    // 1. Fetch digest with match_ids
    let [digest] = await sql`
        SELECT title, headline, summary, match_ids
        FROM daily_digests 
        WHERE date_str = ${date} AND lang = ${normalizedLang} AND league = ${requestedLeague}
        LIMIT 1
    `;

    // Fallback logic for metadata matching page logic
    if (!digest && requestedLeague === 'epl') {
        [digest] = await sql`
            SELECT title, headline, summary, match_ids
            FROM daily_digests 
            WHERE date_str = ${date} AND lang = ${normalizedLang}
            LIMIT 1
        `;
    }

    if (!digest) return { title: `Football Tactics Daily - ${date}` };

    // 2. Fetch match names for SEO keywords
    let matchKeywords = "";
    if (digest.match_ids && Array.isArray(digest.match_ids) && digest.match_ids.length > 0) {
        const matches = await sql`
            SELECT home_team, away_team
            FROM matches
            WHERE match_id IN ${sql(digest.match_ids)}
        `;
        const matchNames = matches.map(m => `${m.home_team} vs ${m.away_team}`).join(", ");
        matchKeywords = matchNames;
    }

    const fullTitle = `${digest.title}: ${matchKeywords} | GoalGazer`;
    const description = `${digest.headline}. Tactical analysis for ${matchKeywords}. ${digest.summary.slice(0, 100)}...`;

    return {
        title: fullTitle.slice(0, 60), // SEO optimal length
        description: description.slice(0, 160), // SEO optimal length
        keywords: [requestedLeague, "football tactics", "match analysis", ...matchKeywords.split(/[ ,]+/)].filter(Boolean),
        openGraph: {
            title: fullTitle,
            description: description,
            type: "article",
            publishedTime: date,
        },
    };
}

export default async function DailyPage({ params: { lang, date }, searchParams }: Props & { searchParams: { league?: string } }) {
    const normalizedLang = normalizeLang(lang);
    const requestedLeague = searchParams.league || 'epl';

    // 1. Try to fetch the requested league digest
    let [digest] = await sql`
        SELECT * 
        FROM daily_digests 
        WHERE date_str = ${date} AND lang = ${normalizedLang} AND league = ${requestedLeague}
        LIMIT 1
    `;

    // 2. If requested league (specifically EPL default) not found, try ANY digest for that date
    if (!digest && requestedLeague === 'epl') {
        [digest] = await sql`
            SELECT * 
            FROM daily_digests 
            WHERE date_str = ${date} AND lang = ${normalizedLang}
            LIMIT 1
        `;
    }

    if (!digest) {
        notFound();
    }

    // 3. Fetch all available leagues for this date to build the switcher
    const availableLeagues = await sql`
        SELECT league, comic_image_url, headline
        FROM daily_digests 
        WHERE date_str = ${date} AND lang = ${normalizedLang}
    `;

    // Fetch details for the matches included in this digest
    let matchHighlights: any[] = [];
    if (digest.match_ids && Array.isArray(digest.match_ids) && digest.match_ids.length > 0) {
        matchHighlights = await sql`
            SELECT m.match_id, m.home_team, m.away_team, m.score, mc.slug, mc.content->>'image' as image, mc.content->>'title' as title
            FROM matches m
            JOIN match_content mc ON m.match_id = mc.match_id
            WHERE m.match_id IN ${sql(digest.match_ids)} AND mc.lang = ${normalizedLang}
        `;
    }

    const { t } = await getT(normalizedLang);

    // 4. Construct JSON-LD for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": digest.headline,
        "image": [digest.comic_image_url],
        "datePublished": date,
        "dateModified": digest.updated_at,
        "author": [{
            "@type": "Organization",
            "name": "GoalGazer AI",
            "url": "https://goalgazer.xyz"
        }],
        "about": matchHighlights.map(match => ({
            "@type": "SportsEvent",
            "name": `${match.home_team} vs ${match.away_team}`,
            "homeTeam": { "@type": "SportsTeam", "name": match.home_team },
            "awayTeam": { "@type": "SportsTeam", "name": match.away_team },
            "sport": "Football"
        }))
    };

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a] bg-[url('/bg-newspaper-dark.png')] bg-repeat bg-fixed bg-contain relative">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="absolute inset-0 bg-black/40 pointer-events-none mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Newspaper Masthead */}
                <header className="mb-16 flex flex-col items-center">
                    {/* Top Meta Bar */}
                    <div className="w-full border-b-2 border-white/20 pb-2 mb-2 flex justify-between items-center font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                        <span>Vol. 1</span>
                        <span>{date}</span>
                        <span>{t("Daily.exclusive_analysis")}</span>
                    </div>

                    {/* Main Title */}
                    <div className="py-8 text-center relative w-full">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter font-serif leading-none">
                            THE GAZETTE
                        </h1>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-10 pointer-events-none">
                            <span className="text-[10rem] font-serif italic text-emerald-500/20 mix-blend-overlay">Tactical</span>
                        </div>
                    </div>

                    {/* Bottom Meta Bar (Double Border) */}
                    <div className="w-full border-t border-b-4 border-double border-white/20 py-3 flex justify-between items-center md:px-12">
                        <div className="flex items-center gap-4 text-white/60 text-xs font-serif italic">
                            <span>Since 2026</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>Daily Edition</span>
                        </div>

                        <SocialShare url={`https://goalgazer.xyz/${lang}/daily/${date}`} title={digest.title} />

                        <div className="flex items-center gap-4 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                            GoalGazer Originals
                        </div>
                    </div>
                </header>

                <DailyDigestView
                    digest={digest as any}
                    lang={normalizedLang}
                    t={t}
                    matchHighlights={matchHighlights}
                    availableLeagues={availableLeagues as any}
                />
            </div>
        </main>
    );
}
