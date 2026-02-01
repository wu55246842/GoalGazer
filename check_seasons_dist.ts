import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });

async function checkSeasons() {
    try {
        const { default: sql } = await import('./apps/web/lib/db.js');
        const rows = await sql`SELECT season, COUNT(*) as count FROM matches GROUP BY season`;
        console.log('Seasons in DB:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkSeasons();
