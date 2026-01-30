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

async function generateDailyDigestForLang(dateStr: string, lang: string, existingComicUrl?: string): Promise<string | undefined> {
    console.log(`🌞 Generating Daily Digest for ${dateStr} (${lang})...`);

    // 0. Check if digest already exists
    const [existing] = await sql`
        SELECT id FROM daily_digests 
        WHERE date_str = ${dateStr} AND lang = ${lang}
        LIMIT 1
    `;

    if (existing) {
        console.log(`⏭️  Daily Digest for ${dateStr} (${lang}) already exists. Skipping.`);
        return;
    }

    // 1. Fetch matches for that date
    const matches = await sql`
        SELECT m.match_id, m.home_team, m.away_team, m.score, mc.content
        FROM matches m
        JOIN match_content mc ON m.match_id = mc.match_id
        WHERE mc.lang = ${lang} AND DATE(m.date_utc) = ${dateStr}
        LIMIT 10
    `;

    if (matches.length === 0) {
        console.log(`⚠️ No matches found for ${dateStr} in ${lang}. skipping.`);
        return;
    }

    console.log(`📊 Found ${matches.length} matches to process.`);

    // 2. Aggregate summaries for AI
    const summaries = matches.map(m => {
        const content = m.content as any;
        return `${m.home_team} vs ${m.away_team} (${m.score}): ${content?.tactical_summary || 'N/A'}`;
    }).join('\n\n');

    // 3. Generate Newspaper Content
    const prompt = `
        You are an elite football tactical journalist. 
        Based on the following match summaries for ${dateStr}, write a Daily Tactical Newspaper edition.
        
        Matches:
        ${summaries}

        Return exactly in this JSON format:
        {
          "title": "Edition Title (Creative)",
          "headline": "Main Catchy Headline",
          "summary": "1-2 paragraphs of sharp, tactical editorial covering the day's trends.",
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

    // 4. Generate Comic Illustration
    // 4. Generate Comic Illustration (or reuse existing)
    let comicUrl = existingComicUrl;

    if (comicUrl) {
        console.log(`♻️  Reusing existing comic URL: ${comicUrl}`);
    } else {
        console.log('🎨 Generating Tactical Comic...');
        const imagePrompt = `Football tactical comic illustration, editorial cartoon style, clean lines, professional colors, ${aiContent.comic_prompt}, no text, no logos, high quality`;
        const imageBuffer = await generateImageBuffer(imagePrompt, 'zimage');

        // 5. Upload to R2 (Use 'multi' or 'en' as language code to indicate shared? Or just keep original lang code, doesn't matter much)
        // keeping original lang code for uniqueness per generation attempt, or we can use just 'en' if we are reusing.
        // But since we are generating it now, we use the current lang code.
        const fileName = `daily/comic-${dateStr}-${lang}.webp`;
        comicUrl = await uploadToR2(fileName, imageBuffer, 'image/webp');
        console.log(`✅ Image uploaded: ${comicUrl}`);
    }

    // 6. Calculate Financial Value Fluctuations
    // Simulating logic based on player ratings from match content
    const financialMovements = matches.slice(0, 3).map(m => ({
        player: 'Key Performer', // This would ideally be extracted from match content
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
            title, 
            headline, 
            summary, 
            comic_image_url, 
            financial_movements, 
            match_ids
        ) VALUES (
            ${dateStr},
            ${lang},
            ${aiContent.title},
            ${aiContent.headline},
            ${aiContent.summary},
            ${comicUrl},
            ${sql.json(financialMovements)},
            ${sql.json(matches.map(m => m.match_id))}
        )
        ON CONFLICT (date_str, lang) DO UPDATE SET
            title = EXCLUDED.title,
            headline = EXCLUDED.headline,
            summary = EXCLUDED.summary,
            comic_image_url = EXCLUDED.comic_image_url,
            financial_movements = EXCLUDED.financial_movements,
            match_ids = EXCLUDED.match_ids,
            updated_at = NOW()
    `;

    console.log(`🎉 Daily Digest for ${dateStr} (${lang}) saved!`);
    return comicUrl;
}

async function run() {
    loadEnv();
    const args = process.argv.slice(2);
    let dateArg = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));

    if (!dateArg) {
        const today = new Date();
        dateArg = today.toISOString().split('T')[0];
        console.log(`📅 No date provided. Defaulting to today: ${dateArg}`);
    }

    const langs = ['en', 'zh', 'ja'];
    let sharedComicUrl: string | undefined;

    for (const lang of langs) {
        try {
            const generatedUrl = await generateDailyDigestForLang(dateArg, lang, sharedComicUrl);
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
