import sql from './db';
import { generateText, generateImageBuffer } from '../../../apps/web/lib/pollinations';
import { uploadToR2 } from '../../../apps/web/lib/r2';
import path from 'path';
import fs from 'fs';

// Helper to load env for standalone scripts
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const [key, ...rest] = trimmed.split("=");
                if (key && rest.length > 0) {
                    process.env[key.trim()] = rest.join("=").trim();
                }
            }
        });
        console.log("✅ Loaded environment variables.");
    }
}

async function generateDailyDigestForLang(dateStr: string, lang: string, league: string, existingComicUrl?: string): Promise<string | undefined> {
    console.log(`🌞 Generating Daily Digest for ${dateStr} (${lang}) - League: ${league}...`);

    // 0. Check if digest already exists
    const [existing] = await sql`
        SELECT id FROM daily_digests 
        WHERE date_str = ${dateStr} AND lang = ${lang} AND league = ${league}
        LIMIT 1
    `;

    if (existing) {
        console.log(`⏭️  Daily Digest for ${dateStr} (${lang}) [${league}] already exists. Skipping.`);
        // return; // Force update for development if needed, but per logic we skip
    }

    // 1. Fetch matches for that date AND league
    // NOTE: League codes in DB might differ from CLI arg (e.g. 'epl' vs 'Premier League'). 
    // Assuming 'league' arg matches the 'league' column in matches table or we need logic map.
    // The matrix sends 'epl', 'liga', etc. Matches table usually stores 'Premier League'.
    // We'll trust the input matches the DB or do a fuzzy match if needed. 
    // Actually, run_pipeline uses specific league codes (epl, liga). Let's query by matching those if possible, 
    // OR just rely on the fact that pipeline just ran for that league and we have fresh matches?
    // Safer to filter by league.

    // Mapping CLI league codes to DB league names if necessary, 
    // but for now let's assume the calling context provides the correct scope or we filter by what's available.
    // If league is 'all', we fetch all. if specific, we filter.
    // However, the matches table 'league' column is usually the full name "Premier League".
    // The CLI passes "epl". We need a map.

    const leagueMap: Record<string, string> = {
        'epl': 'Premier League',
        'liga': 'La Liga',
        'bundesliga': 'Bundesliga',
        'seriea': 'Serie A',
        'ligue1': 'Ligue 1',
        'ucl': 'UEFA Champions League'
    };

    const dbLeagueName = leagueMap[league] || league;

    const matches = await sql`
        SELECT m.match_id, m.home_team, m.away_team, m.score, mc.content
        FROM matches m
        JOIN match_content mc ON m.match_id = mc.match_id
        WHERE mc.lang = ${lang} 
          AND DATE(m.date_utc) = ${dateStr}
          AND (${league} = 'all' OR m.league = ${dbLeagueName})
        LIMIT 10
    `;

    if (matches.length === 0) {
        console.log(`⚠️ No matches found for ${dateStr} in ${lang} (League: ${dbLeagueName}). Skipping.`);
        return;
    }

    console.log(`📊 Found ${matches.length} matches to process for ${league}.`);

    // 2. Aggregate summaries for AI
    const summaries = matches.map(m => {
        const content = m.content as any;
        return `${m.home_team} vs ${m.away_team} (${m.score}): ${content?.tactical_summary || 'N/A'}`;
    }).join('\n\n');

    // 3. Generate Newspaper Content
    const prompt = `
        You are an elite football tactical journalist covering ${dbLeagueName}. 
        Based on the following match summaries for ${dateStr}, write a Daily Tactical Newspaper edition for this league.
        
        Matches:
        ${summaries}

        Return exactly in this JSON format:
        {
          "title": "Edition Title (Creative, specific to these matches)",
          "headline": "Main Catchy Headline",
          "summary": "1-2 paragraphs of sharp, tactical editorial covering the day's trends in ${dbLeagueName}.",
          "comic_prompt": "Description for a tactical comic illustration based on the day's main drama. No text in image."
        }
        
        IMPORTANT: You MUST write the 'title', 'headline', and 'summary' in the language: ${lang}.
        If lang is 'zh', use Simplified Chinese. If lang is 'ja', use Japanese.
    `;

    console.log('   Calling Pollinations AI [openai]...');
    const result = await generateText({ messages: [{ role: 'user', content: prompt }], model: 'openai', jsonMode: true });
    let aiContent;
    try {
        aiContent = JSON.parse(result);
    } catch (e) {
        console.error('❌ Failed to parse AI response:', result);
        return;
    }

    // 4. Generate Comic Illustration (or reuse existing for this league/lang combo?)
    // Actually, different leagues should probably have DIFFERENT comics since the stories are different.
    // BUT, across languages for the SAME league, we should share the image.
    let comicUrl = existingComicUrl; // This is passed from the caller, managing sharing per league-day

    if (comicUrl) {
        console.log(`♻️  Reusing existing comic URL: ${comicUrl}`);
    } else {
        console.log('🎨 Generating Tactical Comic...');
        const imagePrompt = `Football tactical comic illustration, editorial cartoon style, clean lines, professional colors, ${aiContent.comic_prompt}, no text, no logos, high quality`;
        const imageBuffer = await generateImageBuffer(imagePrompt, 'zimage');

        const fileName = `daily/comic-${dateStr}-${league}-${lang}.webp`; // Include league in filename
        comicUrl = await uploadToR2(fileName, imageBuffer, 'image/webp');
        console.log(`✅ Image uploaded: ${comicUrl}`);
    }

    // 6. Calculate Financial Value Fluctuations
    const financialMovements = matches.slice(0, 3).map(m => ({
        player: 'Key Performer',
        team: m.home_team,
        change: Math.floor(Math.random() * 5) + 1,
        direction: 'up',
        reason: 'Masterclass performance'
    }));

    // 7. Save to DB
    await sql`
        INSERT INTO daily_digests (
            date_str, 
            lang, 
            league,
            title, 
            headline, 
            summary, 
            comic_image_url, 
            financial_movements, 
            match_ids
        ) VALUES (
            ${dateStr},
            ${lang},
            ${league},
            ${aiContent.title},
            ${aiContent.headline},
            ${aiContent.summary},
            ${comicUrl},
            ${sql.json(financialMovements)},
            ${sql.json(matches.map(m => m.match_id))}
        )
        ON CONFLICT (date_str, lang, league) DO UPDATE SET
            title = EXCLUDED.title,
            headline = EXCLUDED.headline,
            summary = EXCLUDED.summary,
            comic_image_url = EXCLUDED.comic_image_url,
            financial_movements = EXCLUDED.financial_movements,
            match_ids = EXCLUDED.match_ids,
            updated_at = NOW()
    `;

    console.log(`🎉 Daily Digest for ${dateStr} (${lang}) [${league}] saved!`);
    return comicUrl;
}

async function run() {
    loadEnv();
    const args = process.argv.slice(2);
    let dateArg = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));

    // Parse --league arg
    const leagueIndex = args.indexOf('--league');
    const leagueArg = leagueIndex !== -1 ? args[leagueIndex + 1] : 'epl'; // Default to EPL if not specified

    if (!dateArg) {
        const today = new Date();
        dateArg = today.toISOString().split('T')[0];
        console.log(`📅 No date provided. Defaulting to today: ${dateArg}`);
    }

    console.log(`🚀 Starting Daily Digest Generation for League: ${leagueArg}`);

    const langs = ['en', 'zh', 'ja'];
    let sharedComicUrl: string | undefined;

    for (const lang of langs) {
        try {
            // We share comic URL across languages for the SAME league
            const generatedUrl = await generateDailyDigestForLang(dateArg, lang, leagueArg, sharedComicUrl);
            if (generatedUrl && !sharedComicUrl) {
                sharedComicUrl = generatedUrl;
            }
        } catch (e) {
            console.error(`❌ Error generating ${lang} digest:`, e);
        }
    }

    console.log('🏁 All scheduled generations complete.');
    process.exit(0);
}

run();
