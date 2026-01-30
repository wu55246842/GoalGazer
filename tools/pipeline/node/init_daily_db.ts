import sql from './db';

async function initDailyDb() {
    console.log('🚀 Re-Initializing Daily Digest Database Schema...');

    try {
        // Drop old table to fix constraint issues
        await sql`DROP TABLE IF EXISTS daily_digests CASCADE`;
        console.log('✅ Dropped existing table.');

        await sql`
      CREATE TABLE IF NOT EXISTS daily_digests (
        id SERIAL PRIMARY KEY,
        date_str VARCHAR(20) NOT NULL, -- e.g. "2024-01-30"
        lang VARCHAR(10) NOT NULL,
        title TEXT,
        headline TEXT,
        summary TEXT,
        comic_image_url TEXT,
        financial_movements JSONB,
        match_ids JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(date_str, lang)
      );
    `;

        console.log('✅ Table "daily_digests" created with (date_str, lang) UNIQUE constraint.');
    } catch (error) {
        console.error('❌ Failed to initialize daily digest database:', error);
    } finally {
        await sql.end();
    }
}

initDailyDb();
