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

export default async function DailyPage({ params: { lang, date } }: Props) {
    const normalizedLang = normalizeLang(lang);
    const [digest] = await sql`
    SELECT * 
    FROM daily_digests 
    WHERE date_str = ${date} AND lang = ${normalizedLang}
    LIMIT 1
  `;

    if (!digest) {
        notFound();
    }

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
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#050505]">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                            THE <span className="text-emerald-500">TACTICAL</span> GAZETTE
                        </h1>
                        <p className="text-white/60 font-mono text-sm uppercase tracking-widest">
                            {date} • {t("Daily.exclusive_analysis")}
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0">
                        <SocialShare url={`https://goalgazer.xyz/${lang}/daily/${date}`} title={digest.title} />
                    </div>
                </div>

                <DailyDigestView
                    digest={digest as any}
                    lang={normalizedLang}
                    t={t}
                    matchHighlights={matchHighlights}
                />
            </div>
        </main>
    );
}
