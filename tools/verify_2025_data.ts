
import fs from "fs";
import path from "path";

// Manual .env loader
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const [key, ...rest] = trimmed.split("=");
                if (key && rest.length > 0) {
                    process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, '');
                }
            }
        });
        console.log("✅ Loaded environment variables from .env");
    }
}

async function verify() {
    loadEnv();

    // Dynamic import after env is loaded
    const { default: sql } = await import("../apps/web/lib/db");

    const leagues = [
        { id: 'premier-league', name: 'EPL' },
        { id: 'liga', name: 'La Liga' },
        { id: 'bundesliga', name: 'Bundesliga' },
        { id: 'seriea', name: 'Serie A' },
        { id: 'ligue1', name: 'Ligue 1' }
    ];

    console.log("--- 2025 Season Data Verification ---");

    for (const league of leagues) {
        try {
            // season is character varying (string) in DB
            const result = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(image) as with_images
        FROM matches 
        WHERE league = ${league.id} AND season = '2025'
      `.then(res => res[0]);

            console.log(`${league.name} (${league.id}): ${result.total} matches found, ${result.with_images} with images.`);
        } catch (e) {
            console.error(`Error verifying ${league.name}:`, e);
        }
    }

    try {
        const recentMatches = await sql`
      SELECT id, home_team, away_team, league, image 
      FROM matches 
      WHERE season = '2025' 
      ORDER BY date_utc DESC 
      LIMIT 15
    `;

        console.log("\n--- Recent 2025 Matches (Sample) ---");
        recentMatches.forEach(m => {
            console.log(`[${m.league}] ${m.home_team} vs ${m.away_team} (${m.id}) - Image: ${m.image ? m.image : 'NO'}`);
        });
    } catch (e) {
        console.error("Error fetching recent matches:", e);
    }

    process.exit(0);
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});
