import sql from './apps/web/lib/db';

async function verify() {
    try {
        const rows = await sql`SELECT match_id, image FROM matches WHERE image LIKE 'https://pub-%' LIMIT 1`;
        if (rows.length > 0) {
            console.log("MATCH_IMAGE:", rows[0].image);
            const contentRow = await sql`SELECT content FROM match_content WHERE match_id = ${rows[0].match_id} LIMIT 1`;
            const content = contentRow[0].content;
            console.log("CONTENT_FIGURES_1_SRC:", content.figures[0].src);
        } else {
            console.log("❌ No R2 URLs found in matches table.");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

verify();
