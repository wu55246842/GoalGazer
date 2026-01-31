import { notFound } from "next/navigation";
import sql from "@/lib/db";
import { getT, normalizeLang } from "@/i18n";
import DailyDigestView from "@/components/DailyDigestView";
import SocialShare from "@/components/SocialShare";
import { Metadata } from "next";

interface Props {
    params: { lang: string; date: string };
}

export async function generateMetadata({ params: { lang, date } }: Props): Promise<Metadata> {
    const normalizedLang = normalizeLang(lang);
    const [digest] = await sql`
    SELECT title, headline, summary 
    FROM daily_digests 
    WHERE date_str = ${date} AND lang = ${normalizedLang}
    LIMIT 1
  `;

    if (!digest) return { title: "Daily Tactics" };

    return {
        title: `${digest.title} - GoalGazer ${date}`,
        description: digest.headline,
        openGraph: {
            title: digest.title,
            description: digest.headline,
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

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a] bg-[url('/bg-newspaper-dark.png')] bg-repeat bg-fixed bg-contain relative">
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
