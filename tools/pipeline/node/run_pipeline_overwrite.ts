#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { translateArticle } from "./translate";
import sql from "./db";
import { generateImageBuffer } from "../../../apps/web/lib/pollinations";
import { uploadToR2 } from "../../../apps/web/lib/r2";

// --- Logging Utility ---
const LOG_FILE = path.resolve(process.cwd(), "pipeline_overwrite.log");

function log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${message}`;
    if (data) {
        if (typeof data === 'object') {
            logMessage += `\nDATA: ${JSON.stringify(data, null, 2)}`;
        } else {
            logMessage += `\nDATA: ${data}`;
        }
    }
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + "\n" + "=".repeat(50) + "\n");
}

// Clear log file at start
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
}
log("🚀 Pipeline Overwrite Started");
log(`   Raw Arguments: ${JSON.stringify(process.argv)}`);

// --- Environment Loader ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const [key, ...rest] = trimmed.split("=");
                if (key && rest.length > 0) {
                    process.env[key.trim()] = rest.join("=").trim();
                }
            }
        });
        log("✅ Loaded environment variables from .env");
    } else {
        log("⚠️ .env file not found at project root");
    }
}

function getImageContentType(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".webp":
            return "image/webp";
        case ".svg":
            return "image/svg+xml";
        default:
            return "image/png";
    }
}

async function uploadFiguresToR2(matchId: string, article: Record<string, any>) {
    log(`📤 Uploading figures for match ${matchId} to R2...`);
    const figures = Array.isArray(article.figures) ? article.figures : [];
    if (!figures.length) {
        log("ℹ️ No figures found to upload.");
        return;
    }

    const figuresRoot = path.resolve(process.cwd(), "tools/pipeline/.cache");
    const uploadedMap = new Map<string, string>();

    for (const figure of figures) {
        if (!figure?.src || typeof figure.src !== "string") continue;
        if (figure.src.startsWith("http://") || figure.src.startsWith("https://")) continue;

        const relativeSrc = figure.src.startsWith("/") ? figure.src.slice(1) : figure.src;
        const filePath = path.join(figuresRoot, relativeSrc);

        log(`   Checking figure: ${relativeSrc}`);
        if (!fs.existsSync(filePath)) {
            log(`   ⚠️ Figure file missing: ${filePath}`);
            continue;
        }

        try {
            const body = await fs.promises.readFile(filePath);
            const key = relativeSrc.replace(/^\/+/, "");
            const contentType = getImageContentType(filePath);
            const uploadedUrl = await uploadToR2(key, body, contentType);

            figure.src = uploadedUrl;
            uploadedMap.set(relativeSrc, uploadedUrl);
            log(`   ✅ Uploaded: ${relativeSrc} -> ${uploadedUrl}`);

            await fs.promises.unlink(filePath);
        } catch (err) {
            log(`   ❌ Failed to upload ${relativeSrc}:`, err);
        }
    }

    if (article.frontmatter?.heroImage) {
        const heroImage = article.frontmatter.heroImage as string;
        article.frontmatter.heroImage = uploadedMap.get(heroImage) ?? heroImage;
        log(`   🎯 Hero image updated: ${article.frontmatter.heroImage}`);
    }
}

async function main() {
    loadEnv();
    const args = process.argv.slice(2);
    const matchId = getArgValue(args, "--matchId", "");
    const league = getArgValue(args, "--league", "epl"); // Default for Python runner
    const season = getArgValue(args, "--season", "2025"); // Default for Python runner

    if (!matchId) {
        console.error("❌ Error: --matchId is mandatory.");
        log("❌ Error: --matchId is mandatory. Pipeline aborted.");
        process.exit(1);
    }

    log(`🎯 Targeted Overwrite for Match: ${matchId}`);
    log(`   (League/Season parameters are optional; the actual data will be fetched from API based on match_id)`);

    const pythonCwd = path.resolve(__dirname, "../python");
    const venvPython = process.platform === "win32"
        ? path.resolve(__dirname, "../../../venv/Scripts/python.exe")
        : path.resolve(__dirname, "../../../venv/bin/python");
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : "python";

    log(`   🐍 Using Python: ${pythonCmd}`);

    try {
        await processSingleMatch(matchId, league, season, pythonCmd, pythonCwd);
        log("✅ Overwrite Pipeline Finished Successfully.");
    } catch (error) {
        log("❌ Pipeline Failed:", error);
        process.exit(1);
    }
}

async function processSingleMatch(matchId: string, league: string, season: string, pythonCmd: string, pythonCwd: string) {
    const pythonModule = "goalgazer";

    log(`   ⚙️ Invoking Python module: ${pythonModule} for analysis...`);
    const pythonArgs = ["-m", pythonModule, "--matchId", matchId, "--league", league];
    log(`   Command: ${pythonCmd} ${pythonArgs.join(" ")}`);

    const pythonResult = spawnSync(pythonCmd, pythonArgs, {
        cwd: pythonCwd,
        encoding: "utf-8"
    });

    if (pythonResult.status !== 0) {
        log("   ❌ Python Script Error");
        log("   STDOUT:", pythonResult.stdout);
        log("   STDERR:", pythonResult.stderr);
        throw new Error(`Python generation failed with code ${pythonResult.status}`);
    }

    log("   ✅ Python Script Completed. Parsing output...");

    let englishPayload: any;
    try {
        const stdout = pythonResult.stdout;
        const firstBrace = stdout.indexOf('{');
        const lastBrace = stdout.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
            log("   ❌ No JSON found in Python output", stdout);
            throw new Error("No JSON block found in Python output");
        }

        const jsonString = stdout.substring(firstBrace, lastBrace + 1);
        englishPayload = JSON.parse(jsonString);
        log("   📄 English Analysis Result (First 500 chars of JSON):", JSON.stringify(englishPayload).slice(0, 500) + "...");
    } catch (e: any) {
        log(`   ❌ Failed to parse Python stdout: ${e.message}`);
        throw new Error(`Unable to parse generated article for matchId ${matchId}.`);
    }

    // Upload figures
    await uploadFiguresToR2(matchId, englishPayload);

    // AI Match Illustration
    log(`   🎨 Generating AI illustration for ${matchId}...`);
    const teams = englishPayload.frontmatter?.teams || [];
    const home = teams[0] || "Home Team";
    const away = teams[1] || "Away Team";
    const leagueDisplayName = englishPayload.frontmatter?.league || "Football Match";
    const prompt = `真实的比赛图片, A stylized football match illustration representing ${home} vs ${away}, ${leagueDisplayName} match atmosphere, abstract players in motion, no identifiable faces, stadium lights, crowd as soft silhouettes, tactical diagrams and data visualization overlays, editorial illustration style, clean and modern, no logos, no team badges, no text`;

    log(`   Prompt: ${prompt}`);
    const imageBuffer = await generateImageBuffer(prompt, 'zimage');
    log(`   ✅ Image generated (${imageBuffer.length} bytes)`);

    const r2Key = `matches/${matchId}.png`;
    const imageUrl = await uploadToR2(r2Key, imageBuffer, "image/png");
    log(`   ✅ AI Illustration uploaded to R2: ${imageUrl}`);

    // Save English
    log(`   💾 Saving English version to database (OVERWRITE)...`);
    await saveToDatabase(matchId, "en", englishPayload, imageUrl);

    // Translate
    for (const lang of ["zh", "ja"] as const) {
        log(`   🌏 Translating to ${lang}...`);
        try {
            const translated = await translateArticle(englishPayload, lang);
            log(`   ✅ Translation (${lang}) successful.`);
            log(`   💾 Saving ${lang} version to database (OVERWRITE)...`);
            await saveToDatabase(matchId, lang, translated);
        } catch (err) {
            log(`   ❌ Translation/Save failed for ${lang}:`, err);
        }
    }
}

async function saveToDatabase(matchId: string, lang: string, article: Record<string, any>, imageUrl: string = "") {
    const sanitizedArticle = sanitizeForDatabase(article);
    const frontmatter = sanitizedArticle.frontmatter || {};
    const match = sanitizedArticle.match || {};
    const teams = frontmatter.teams || [];
    const homeTeam = teams[0] || (match.homeTeam && match.homeTeam.name) || "Unknown Home";
    const awayTeam = teams[1] || (match.awayTeam && match.awayTeam.name) || "Unknown Away";
    const scoreRaw = match.score ? `${match.score.home}-${match.score.away}` : "0-0";

    log(`   📊 Prepared DB Payload [${lang}]`, {
        match_id: matchId,
        league: frontmatter.league,
        home: homeTeam,
        away: awayTeam,
        score: scoreRaw
    });

    try {
        // 1. Upsert Match
        await sql`
      INSERT INTO matches (
        match_id, league, season, home_team, away_team, date_utc, score, image, updated_at
      ) VALUES (
        ${matchId}, 
        ${String(frontmatter.league || 'unknown')}, 
        ${String(match.season || '2025')}, 
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
        ${sql.json(sanitizedArticle)},
        NOW()
      )
      ON CONFLICT (match_id, lang) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        slug = EXCLUDED.slug,
        content = EXCLUDED.content,
        updated_at = NOW()
    `;
        log(`   ✅ DB Update successful: ${matchId} (${lang})`);
    } catch (err) {
        log(`   ❌ DB Error for ${matchId} (${lang}):`, err);
        throw err;
    }
}

function sanitizeForDatabase<T>(value: T): T {
    if (typeof value === "string") {
        return value.replace(/\u0000/g, "") as T;
    }
    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeForDatabase(entry)) as T;
    }
    if (value && typeof value === "object") {
        const output: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            output[key] = sanitizeForDatabase(entry);
        }
        return output as T;
    }
    return value;
}

function getArgValue(argsList: string[], flag: string, fallback: string): string {
    // 1. Exact flag then next value: --matchId 123
    const idx = argsList.indexOf(flag);
    if (idx !== -1 && argsList[idx + 1] && !argsList[idx + 1].startsWith('-')) {
        return argsList[idx + 1];
    }

    // 2. Combined flag: --matchId=123 or matchId=123
    const cleanFlag = flag.replace(/^--/, '');
    for (const arg of argsList) {
        if (arg.startsWith(`${flag}=`)) {
            return arg.split('=')[1];
        }
        if (arg.startsWith(`--${cleanFlag}=`)) {
            return arg.split('=')[1];
        }
        if (arg.startsWith(`${cleanFlag}=`)) {
            return arg.split('=')[1];
        }
    }

    // 3. Last ditch: any arg that looks like an ID if it's the only one
    if (cleanFlag === 'matchId' && argsList.length === 1 && /^\d+$/.test(argsList[0])) {
        return argsList[0];
    }

    return fallback;
}

main();
