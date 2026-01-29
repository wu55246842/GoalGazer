import sql from './apps/web/lib/db';

async function check() {
    try {
        const rows = await sql`SELECT content FROM match_content LIMIT 1`;
        console.log(JSON.stringify(rows[0].content, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
