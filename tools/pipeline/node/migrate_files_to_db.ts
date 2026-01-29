import fs from 'fs';
import path from 'path';
import sql from './db';

// Hardcoded paths based on project structure
const CONTENT_ROOT = path.resolve(process.cwd(), "apps/web/content");
const MATCHES_DIR = path.join(CONTENT_ROOT, "matches");

async function migrate() {
  console.log(`🚀 Starting Migration from ${MATCHES_DIR} to DB...`);

  if (!fs.existsSync(MATCHES_DIR)) {
    console.error(`❌ Matches directory not found at ${MATCHES_DIR}`);
    return;
  }

  const items = fs.readdirSync(MATCHES_DIR);
  console.log(`📂 Found ${items.length} items to check.`);

  for (const item of items) {
    // We expect folders named by match_id (e.g., "1035550")
    // Inside: index.en.json, index.zh.json, index.ja.json
    // OR flat files (legacy): 1035550.json (en)

    const fullPath = path.join(MATCHES_DIR, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      const matchId = item;
      console.log(`\n🔹 Processing Folder: ${matchId}`);

      const files = fs.readdirSync(fullPath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        // Extract lang from filenames like "index.en.json" or "en.json"
        let lang = "en";
        if (file.includes('.zh.')) lang = "zh";
        else if (file.includes('.ja.')) lang = "ja";
        else if (file === "zh.json") lang = "zh";
        else if (file === "ja.json") lang = "ja";

        console.log(`   - Reading ${file} as ${lang}`);
        const filePath = path.join(fullPath, file);
        await processFile(matchId, lang, filePath);
      }

    } else if (item.endsWith('.json')) {
      // Legacy flat file support: "12345.json" -> matchId=12345, lang=en
      // or "12345.zh.json"
      const parts = item.split('.');
      const matchId = parts[0]; // simplistic assumes matchId is first part
      let lang = "en";
      if (parts.includes('zh')) lang = "zh";
      if (parts.includes('ja')) lang = "ja";

      console.log(`\n🔹 Processing File: ${item} (${matchId}, ${lang})`);
      await processFile(matchId, lang, fullPath);
    }
  }

  console.log("\n✅ Migration Complete.");
  await sql.end();
}

async function processFile(matchId: string, lang: string, filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const article = JSON.parse(raw);
    await saveToDatabase(matchId, lang, article);
  } catch (e) {
    console.error(`   ❌ Failed to migrate ${filePath}:`, e);
  }
}

async function saveToDatabase(matchId: string, lang: string, article: Record<string, any>) {
  const frontmatter = article.frontmatter || {};
  const match = article.match || {};
  const teams = frontmatter.teams || [];
  const homeTeam = teams[0] || (match.homeTeam && match.homeTeam.name) || "Unknown Home";
  const awayTeam = teams[1] || (match.awayTeam && match.awayTeam.name) || "Unknown Away";
  const scoreRaw = match.score ? `${match.score.home}-${match.score.away}` : "0-0";

  // 1. Upsert Match (Only needed once, but upsert is safe)
  await sql`
    INSERT INTO matches (
      match_id, league, season, home_team, away_team, date_utc, score, updated_at
    ) VALUES (
      ${matchId}, 
      ${String(frontmatter.league || 'unknown')}, 
      ${String(match.season || '2025')}, 
      ${homeTeam}, 
      ${awayTeam}, 
      ${frontmatter.date || new Date().toISOString()}, 
      ${scoreRaw},
      NOW()
    )
    ON CONFLICT (match_id) DO UPDATE SET
      league = EXCLUDED.league,
      season = EXCLUDED.season,
      home_team = EXCLUDED.home_team,
      away_team = EXCLUDED.away_team,
      date_utc = EXCLUDED.date_utc,
      score = EXCLUDED.score,
      updated_at = NOW()
  `;

  // 2. Upsert Content
  await sql`
    INSERT INTO match_content (
      match_id, lang, title, description, slug, content, updated_at
    ) VALUES (
      ${matchId},
      ${lang},
      ${frontmatter.title || ""},
      ${frontmatter.description || ""},
      ${frontmatter.slug || matchId},
      ${sql.json(article)},
      NOW()
    )
    ON CONFLICT (match_id, lang) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      slug = EXCLUDED.slug,
      content = EXCLUDED.content,
      updated_at = NOW()
  `;
  console.log(`      💾 Saved to DB.`);
}

migrate().catch(console.error);
