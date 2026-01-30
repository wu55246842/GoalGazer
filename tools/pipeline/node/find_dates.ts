import sql from './db';

async function findDates() {
    try {
        const rows = await sql`SELECT DISTINCT DATE(date_utc) as d FROM matches ORDER BY d DESC LIMIT 10`;
        console.log(JSON.stringify(rows));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

findDates();
