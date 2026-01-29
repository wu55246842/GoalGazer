import sql from './apps/web/lib/db';

async function testUpdate() {
    try {
        console.log("Reading match 1035550 (zh)...");
        const rows = await sql`SELECT content FROM match_content WHERE match_id = '1035550' AND lang = 'zh'`;
        if (rows.length === 0) {
            console.log("Match not found.");
            process.exit(0);
        }

        const content = rows[0].content;
        const oldSrc = content.figures[0].src;
        console.log("Old SRC:", oldSrc);

        const newSrc = "https://pub-97ef9c6706fb4d328dd4f5c8ab4f8f1b.r2.dev/test.png";
        content.figures[0].src = newSrc;

        console.log("Updating...");
        const result = await sql`UPDATE match_content SET content = ${content} WHERE match_id = '1035550' AND lang = 'zh'`;
        console.log("Update result rows affected:", result.count);

        const rowsAfter = await sql`SELECT content FROM match_content WHERE match_id = '1035550' AND lang = 'zh'`;
        console.log("New SRC in DB:", rowsAfter[0].content.figures[0].src);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

testUpdate();
