import sql from './db';

async function checkLeagues() {
    try {
        const rows = await sql`SELECT DISTINCT league FROM matches`;
        console.log('Distinct leagues in DB:', rows);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

checkLeagues();
