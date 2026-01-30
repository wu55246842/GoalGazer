import sql from './db';

async function check() {
    const res = await sql`SELECT lang, headline, summary FROM daily_digests WHERE date_str = '2026-01-27'`;
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}

check();
