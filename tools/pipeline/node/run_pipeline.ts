#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { ensureMatchContentDir, findMatchContentFile, getGeneratedContentPath, getMatchIllustrationPath } from "./paths";
import { translateArticle } from "./translate";
import sql from "./db";
import { generateImageBuffer } from "../../../apps/web/lib/pollinations";
import { uploadToR2 } from "../../../apps/web/lib/r2";

// Manual .env loader to avoid adding dependencies
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
    console.log("✅ Loaded environment variables from .env");
  } else {
    console.log("⚠️ .env file not found at project root");
  }
}

// ... imports

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const league = getArgValue(args, "--league", "epl");
  const season = getArgValue(args, "--season", "2023");
  const matchIdArg = getArgValue(args, "--matchId", "");

  // Python environment setup
  const pythonCwd = path.resolve(__dirname, "../python");
  const venvPython = process.platform === "win32"
    ? path.resolve(__dirname, "../../../venv/Scripts/python.exe")
    : path.resolve(__dirname, "../../../venv/bin/python");
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : "python";

  if (matchIdArg) {
    console.log(`🎯 Processing single match: ${matchIdArg}`);
    await processSingleMatch(matchIdArg, league, season, pythonCmd, pythonCwd);
  } else {
    console.log(`🔄 Starting batch pipeline for ${league} ${season}...`);

    // 1. Get existing match index
    const existingIds = await getExistingMatchIds();
    console.log(`📚 Found ${existingIds.length} existing matches in DB`);

    // 2. Fetch recent matches from API
    const recentMatches = fetchRecentMatches(league, season, pythonCmd, pythonCwd);
    console.log(`📡 Fetched ${recentMatches.length} recent matches from API`);

    // 3. Filter out existing
    const toProcess = recentMatches.filter(m => !existingIds.includes(m.matchId));
    console.log(`📝 ${toProcess.length} new matches to process.`);

    // 4. Process Loop
    for (const match of toProcess) {
      console.log(`\n▶️  Processing ${match.home} vs ${match.away} (${match.matchId})...`);
      try {
        await processSingleMatch(match.matchId, league, season, pythonCmd, pythonCwd);
      } catch (err) {
        console.error(`❌ Failed to process match ${match.matchId}:`, err);
        // Continue to next match
      }
    }
  }

  console.log("\n✅ Pipeline Finished.");
}

async function getExistingMatchIds(): Promise<string[]> {
  try {
    const rows = await sql`SELECT match_id FROM matches`;
    return rows.map(r => r.match_id);
  } catch (e) {
    console.warn("⚠️ DB Check failed, returning empty list:", e);
    return [];
  }
}

interface MatchBasicInfo {
  matchId: string;
  home: string;
  away: string;
  date: string;
  score: string;
}

function fetchRecentMatches(league: string, season: string, pythonCmd: string, cwd: string): MatchBasicInfo[] {
  const fetchScript = path.resolve(cwd, "fetch_fixtures.py");
  const result = spawnSync(pythonCmd, [fetchScript, "--league", league, "--season", season, "--limit", "10", "--json"], {
    cwd,
    encoding: "utf-8"
  });

  if (result.status !== 0) {
    console.error("❌ Failed to fetch matches list.");
    console.error(result.stderr);
    return [];
  }

  try {
    return JSON.parse(result.stdout);
  } catch (e) {
    console.error("❌ Failed to parse matches JSON:", result.stdout);
    return [];
  }
}

async function processSingleMatch(matchId: string, league: string, season: string, pythonCmd: string, pythonCwd: string) {
  const pythonModule = "goalgazer";

  const checkPath = getGeneratedContentPath(matchId, "en");
  if (!fs.existsSync(checkPath)) {
    console.log(`   Generating English content for ${matchId}...`);
    const pythonArgs = ["-m", pythonModule, "--matchId", matchId, "--league", league];
    const pythonResult = spawnSync(pythonCmd, pythonArgs, { stdio: "inherit", cwd: pythonCwd });
    if (pythonResult.status !== 0) {
      throw new Error(`Python generation failed with code ${pythonResult.status}`);
    }
  } else {
    console.log(`   English content exists.`);
  }

  const englishSourcePath = findMatchContentFile(matchId);
  const englishContentPath = getGeneratedContentPath(matchId, "en");
  const englishPayloadPath = englishSourcePath || (fs.existsSync(englishContentPath) ? englishContentPath : null);

  if (!englishPayloadPath) {
    throw new Error(`Unable to locate generated article for matchId ${matchId}.`);
  }

  // 1. Generate English Analysis
  const englishPayload = JSON.parse(fs.readFileSync(englishPayloadPath, "utf-8"));

  // 2. Generate AI Match Illustration (English phase)
  console.log(`   🎨 Generating AI illustration for ${matchId}...`);
  const teams = englishPayload.frontmatter?.teams || [];
  const home = teams[0] || "Home Team";
  const away = teams[1] || "Away Team";
  const leagueDisplayName = englishPayload.frontmatter?.league || "Football Match";

  const prompt = `真实的比赛图片, A stylized football match illustration representing ${home} vs ${away}, ${leagueDisplayName} match atmosphere, abstract players in motion, no identifiable faces, stadium lights, crowd as soft silhouettes, tactical diagrams and data visualization overlays, editorial illustration style, clean and modern, no logos, no team badges, no text`;

  const imageBuffer = await generateImageBuffer(prompt, 'zimage');

  // Upload to R2
  const r2Key = `matches/${matchId}.png`;
  const imageUrl = await uploadToR2(r2Key, imageBuffer, "image/png");

  // 3. Save English to Database
  try {
    await saveToDatabase(matchId, "en", englishPayload, imageUrl);
  } catch (dbErr) {
    console.error(`❌ DB Save failed for ${matchId}/en:`, dbErr);
  }

  // 4. Translate & Save Localized Versions
  for (const lang of ["zh", "ja"] as const) {
    console.log(`   Translating to ${lang}...`);
    try {
      const translated = await translateArticle(englishPayload, lang);
      await saveToDatabase(matchId, lang, translated);
    } catch (err) {
      console.error(`❌ Translation/Save failed for ${matchId}/${lang}:`, err);
    }
  }
}

async function saveToDatabase(matchId: string, lang: string, article: Record<string, any>, imageUrl: string = "") {
  const frontmatter = article.frontmatter || {};
  const match = article.match || {};
  const teams = frontmatter.teams || [];
  const homeTeam = teams[0] || (match.homeTeam && match.homeTeam.name) || "Unknown Home";
  const awayTeam = teams[1] || (match.awayTeam && match.awayTeam.name) || "Unknown Away";
  const scoreRaw = match.score ? `${match.score.home}-${match.score.away}` : "0-0";

  // 1. Upsert Match
  await sql`
    INSERT INTO matches (
      match_id, league, season, home_team, away_team, date_utc, score, image, updated_at
    ) VALUES (
      ${matchId}, 
      ${String(frontmatter.league || 'unknown')}, 
      ${String(match.season || '2023')}, 
      ${homeTeam}, 
      ${awayTeam}, 
      ${frontmatter.date || new Date().toISOString()}, 
      ${scoreRaw},
      ${imageUrl || null},
      NOW()
    )
    ON CONFLICT (match_id) DO UPDATE SET
      league = EXCLUDED.league,
      season = EXCLUDED.season,
      home_team = EXCLUDED.home_team,
      away_team = EXCLUDED.away_team,
      date_utc = EXCLUDED.date_utc,
      score = EXCLUDED.score,
      image = COALESCE(NULLIF(EXCLUDED.image, ''), matches.image),
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
  console.log(`   💾 Saved to DB: ${matchId} (${lang})`);
}


function getArgValue(argsList: string[], flag: string, fallback: string): string {
  const idx = argsList.indexOf(flag);
  if (idx !== -1 && argsList[idx + 1]) {
    return argsList[idx + 1];
  }
  return fallback;
}

main().catch((error) => {
  console.error("❌ Pipeline failed:", error);
  process.exit(1);
});



// End of file
