import sql from './db';

async function check() {
    console.log('--- Daily Digests ---');
    const res = await sql`SELECT date_str, lang, title FROM daily_digests ORDER BY date_str DESC`;
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}

check();
