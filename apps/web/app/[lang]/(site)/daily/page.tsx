import { redirect, notFound } from "next/navigation";
import sql from "@/lib/db";
import { normalizeLang } from "@/i18n";

interface Props {
    params: { lang: string };
}

export default async function DailyLandingPage({ params }: Props) {
    const lang = normalizeLang(params.lang);

    // Fetch the most recent date for this language
    const [latest] = await sql`
    SELECT date_str 
    FROM daily_digests 
    WHERE lang = ${lang}
    ORDER BY date_str DESC 
    LIMIT 1
  `;

    if (!latest) {
        // If no recent one for this lang, try to find ANY recent one
        const [anyLatest] = await sql`
      SELECT date_str 
      FROM daily_digests 
      ORDER BY date_str DESC 
      LIMIT 1
    `;

        if (!anyLatest) {
            notFound();
        }

        redirect(`/${lang}/daily/${anyLatest.date_str}`);
    }

    redirect(`/${lang}/daily/${latest.date_str}`);
}
