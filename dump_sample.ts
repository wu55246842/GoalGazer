import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });

async function dumpSample() {
    try {
        const { default: sql } = await import('./apps/web/lib/db.js');
        const rows = await sql`SELECT content FROM match_content LIMIT 1`;
        if (rows.length > 0) {
            console.log(JSON.stringify(rows[0].content, null, 2));
        } else {
            console.log('No content found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        // We need to wait for dynamic import to finalize or just end if we got it
    }
}

dumpSample();
