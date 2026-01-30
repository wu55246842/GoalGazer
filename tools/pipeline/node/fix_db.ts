import sql from './db';

async function fix() {
    console.log('Dropping daily_digests...');
    await sql`DROP TABLE IF EXISTS daily_digests`;
    console.log('Done.');
    process.exit(0);
}

fix();
