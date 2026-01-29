import sql from './apps/web/lib/db';

async function check() {
    try {
        const rows = await sql`SELECT match_id, image FROM matches`;
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
