import fs from "fs";
import path from "path";
import sql from "../apps/web/lib/db";
import { uploadToR2 } from "../apps/web/lib/r2";

async function migrate() {
    console.log("🚀 Starting Comprehensive Image Migration to R2...");

    const repoRoot = path.resolve(__dirname, "..");

    // 1. Get all matches
    const matches = await sql`SELECT match_id::text as match_id, image FROM matches`;
    console.log(`📂 Processing ${matches.length} matches...`);

    for (const match of matches) {
        const matchId = match.match_id;
        console.log(`\n▶️  Match ${matchId}:`);

        // --- Handle AI Match Illustration ---
        const localIllustrationPath = path.join(repoRoot, "apps", "web", "public", "generated", "matches", `${matchId}.png`);
        if (fs.existsSync(localIllustrationPath)) {
            try {
                const buffer = fs.readFileSync(localIllustrationPath);
                const r2Key = `matches/${matchId}.png`;
                const publicUrl = await uploadToR2(r2Key, buffer, "image/png");

            } catch (err) {
                console.error(`   ❌ Failed to migrate AI Illustration:`, err);
            }
        } else {
            console.log(`   ℹ️  No AI Illustration found locally.`);
        }

        // --- Handle Visualizations (Charts) ---
        const contentRows = await sql`SELECT content, lang FROM match_content WHERE match_id = ${matchId.toString()}`;
        for (const contentRow of contentRows) {
            let content = contentRow.content;
            const lang = contentRow.lang;
            let modified = false;

            if (content.figures && Array.isArray(content.figures)) {
                for (const figure of content.figures) {
                    if (figure.src && figure.src.startsWith("/generated/matches/")) {
                        const localPath = path.join(repoRoot, "apps", "web", "public", figure.src.startsWith("/") ? figure.src.slice(1) : figure.src);

                        if (fs.existsSync(localPath)) {
                            try {
                                const buffer = fs.readFileSync(localPath);
                                // Key includes the matchId and the filename (e.g. "matches/123/shot_proxy.png")
                                const r2Key = figure.src.startsWith("/generated/") ? figure.src.replace("/generated/", "") : figure.src;
                                const publicUrl = await uploadToR2(r2Key, buffer, "image/png");

                                figure.src = publicUrl;
                                modified = true;
                            } catch (err) {
                                console.error(`   ❌ Failed to migrate chart ${figure.src}:`, err);
                            }
                        } else {
                            console.warn(`   ⚠️  Chart file not found: ${localPath}`);
                        }
                    }
                }
            }

            // Also check internal sections for figures
            if (content.sections && Array.isArray(content.sections)) {
                for (const section of content.sections) {
                    if (section.figures && Array.isArray(section.figures)) {
                        for (const figure of section.figures) {
                            if (figure.src && figure.src.startsWith("/generated/matches/")) {
                                const localPath = path.join(repoRoot, "apps", "web", "public", figure.src.startsWith("/") ? figure.src.slice(1) : figure.src);
                                if (fs.existsSync(localPath)) {
                                    try {
                                        const buffer = fs.readFileSync(localPath);
                                        const r2Key = figure.src.startsWith("/generated/") ? figure.src.replace("/generated/", "") : figure.src;
                                        const publicUrl = await uploadToR2(r2Key, buffer, "image/png");
                                        figure.src = publicUrl;
                                        modified = true;
                                    } catch (err) {
                                        console.error(`   ❌ Failed to migrate section chart ${figure.src}:`, err);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (modified) {
                const updateRes = await sql`UPDATE match_content SET content = ${content} WHERE match_id = ${matchId.toString()} AND lang = ${lang}`;
                console.log(`   ✅ match_content JSON updated with R2 URLs for lang: ${lang}. (${updateRes.count} rows affected)`);
            }
        }
    }

    console.log("\n✨ Migration Finished.");
    process.exit(0);
}

migrate();
