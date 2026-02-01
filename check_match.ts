import sql from './apps/web/lib/db';

async function checkMatch() {
    try {
        console.log('Checking match 1379189...\n');

        // Check if match exists
        const match = await sql`
            SELECT * FROM matches WHERE match_id = '1379189'
        `;
        console.log('Match in matches table:', JSON.stringify(match, null, 2));

        // Check match content
        const content = await sql`
            SELECT mc.lang, mc.slug, mc.title, 
                   jsonb_typeof(mc.content) as content_type,
                   m.image
            FROM match_content mc
            JOIN matches m ON mc.match_id = m.match_id
            WHERE mc.match_id = '1379189'
        `;
        console.log('\nMatch content:', JSON.stringify(content, null, 2));

        // Also try by slug
        const bySlug = await sql`
            SELECT mc.match_id, mc.lang, mc.slug
            FROM match_content mc
            WHERE mc.slug = 'arsenal-vs-manchester-united-1379189'
        `;
        console.log('\nBy slug:', JSON.stringify(bySlug, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sql.end();
    }
}

checkMatch();
