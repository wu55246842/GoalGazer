import postgres from 'postgres';
import path from 'path';
import fs from 'fs';

// Helper to load env for standalone scripts (if not using nextjs dotenv)
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
    }
}

if (!process.env.DATABASE_URL) {
    loadEnv();
}

if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is missing from environment variables.");
}

const sql = postgres(process.env.DATABASE_URL!, {
    ssl: 'require',
});

export default sql;
