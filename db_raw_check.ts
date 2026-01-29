import sql from './apps/web/lib/db';

async function check() {
    try {
        const rows = await sql`SELECT match_id, lang, content FROM match_content LIMIT 5`;
        for (const row of rows) {
            console.log(`--- Match ${row.match_id} (${row.lang}) ---`);
            const firstFigure = row.content.figures ? row.content.figures[0] : null;
            console.log(`First Figure SRC: ${firstFigure ? firstFigure.src : 'N/A'}`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
