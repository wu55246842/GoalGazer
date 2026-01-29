
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
    }
}

async function inspect() {
    loadEnv();
    const { default: sql } = await import("../apps/web/lib/db");

    const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'matches'
  `;

    console.log("--- Matches Table Schema ---");
    columns.forEach(c => {
        console.log(`${c.column_name}: ${c.data_type}`);
    });

    process.exit(0);
}

inspect().catch(e => {
    console.error(e);
    process.exit(1);
});
