import sql from './apps/web/lib/db';

async function verify() {
    try {
        const rows = await sql`SELECT match_id, content FROM match_content LIMIT 10`;
        let found = false;
        for (const row of rows) {
            const content = row.content;
            if (content.figures && content.figures.length > 0) {
                const src = content.figures[0].src;
                if (src.startsWith('https://pub-')) {
                    console.log(`✅ Match ${row.match_id}: Found R2 URL in figures: ${src}`);
                    found = true;
                }
            }
        }
        if (!found) {
            console.log("❌ No R2 URLs found in any match_content figures.");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

verify();
