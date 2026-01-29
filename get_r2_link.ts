import sql from './apps/web/lib/db';

async function getLink() {
    try {
        console.log("--- AI Match Illustration Link ---");
        const matchRow = await sql`SELECT image FROM matches WHERE image IS NOT NULL LIMIT 1`;
        if (matchRow.length > 0) {
            console.log(matchRow[0].image);
        } else {
            console.log("No match illustrations found in database.");
        }

        console.log("\n--- Python Generated Chart Link ---");
        const contentRows = await sql`SELECT content FROM match_content LIMIT 20`;
        let chartFound = false;
        for (const row of contentRows) {
            const figures = row.content.figures || [];
            if (figures.length > 0 && figures[0].src.startsWith('https://pub-')) {
                console.log(figures[0].src);
                chartFound = true;
                break;
            }
        }
        if (!chartFound) console.log("No R2 chart links found in match_content.");

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

getLink();
