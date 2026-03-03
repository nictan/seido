import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function createTables(dbUrl: string, label: string) {
    const db = drizzle(neon(dbUrl));
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_features (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            profile_id UUID NOT NULL,
            feature TEXT NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT user_features_profile_id_fkey
                FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
            CONSTRAINT user_features_profile_feature_key UNIQUE (profile_id, feature)
        )
    `);
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS site_config (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await db.execute(sql`
        INSERT INTO site_config (key, value)
        VALUES
            ('default_grading', 'true'),
            ('default_referee_prep', 'false')
        ON CONFLICT (key) DO NOTHING
    `);
    console.log(`[${label}] Tables created and site_config seeded.`);
}

async function main() {
    await createTables(process.env.DEV_DB_URL!, 'DEV');
    await createTables(process.env.PROD_DB_URL!, 'PROD');
    process.exit(0);
}
main();
