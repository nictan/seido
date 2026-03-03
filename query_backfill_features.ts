/**
 * Seeds user_features for existing profiles that don't have them yet.
 * Grants grading=true, referee_prep=false (the site defaults) to all existing users.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function seedExistingUsers(dbUrl: string, label: string) {
    const db = drizzle(neon(dbUrl));

    // Get all profile IDs
    const profiles = await db.execute(sql`SELECT id FROM profiles`);
    const defaults = [
        { feature: 'grading', enabled: true },
        { feature: 'referee_prep', enabled: false },
    ];

    let count = 0;
    for (const profile of profiles.rows as any[]) {
        for (const { feature, enabled } of defaults) {
            await db.execute(sql`
                INSERT INTO user_features (profile_id, feature, enabled)
                VALUES (${profile.id}, ${feature}, ${enabled})
                ON CONFLICT (profile_id, feature) DO NOTHING
            `);
        }
        count++;
    }

    console.log(`[${label}] Seeded features for ${count} existing profile(s).`);
}

async function main() {
    await seedExistingUsers(process.env.DEV_DB_URL!, 'DEV');
    await seedExistingUsers(process.env.PROD_DB_URL!, 'PROD');
    process.exit(0);
}
main();
