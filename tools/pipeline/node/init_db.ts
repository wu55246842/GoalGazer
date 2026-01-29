import sql from './db';

async function initDb() {
    console.log('🚀 Initializing Database Schema...');

    try {
        // 1. Create Matches Table
        await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(50) UNIQUE NOT NULL,
        league VARCHAR(50),
        season VARCHAR(20),
        home_team VARCHAR(100),
        away_team VARCHAR(100),
        date_utc TIMESTAMP WITH TIME ZONE,
        score VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
        console.log('✅ Table "matches" ensured.');

        // 2. Create Match Content Table (Localized)
        await sql`
      CREATE TABLE IF NOT EXISTS match_content (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(50) REFERENCES matches(match_id) ON DELETE CASCADE,
        lang VARCHAR(10) NOT NULL,
        title TEXT,
        description TEXT,
        slug TEXT,
        content JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, lang)
      );
    `;
        console.log('✅ Table "match_content" ensured.');

        console.log('🎉 Database initialization complete.');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await sql.end();
    }
}

initDb();
