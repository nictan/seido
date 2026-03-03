import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const email = 'nicorasu.tan@gmail.com';

    console.log("Locating auth user...");
    const { sql } = await import('drizzle-orm');
    const authUsers = await db.execute(sql`SELECT id FROM neon_auth.user WHERE email = ${email}`);

    if (authUsers.rows.length === 0) {
        console.log("No auth user found for", email);
        process.exit(0);
    }

    const userId = authUsers.rows[0].id as string;
    console.log("Found user ID:", userId);

    console.log("Deleting profiles...");
    const userProfiles = await db.query.profiles.findMany({
        where: eq(profiles.userId, userId)
    });

    for (const profile of userProfiles) {
        console.log("Deleting rank histories for profile", profile.id);
        await db.delete(rankHistories).where(eq(rankHistories.profileId, profile.id));

        console.log("Deleting karate profile for profile", profile.id);
        await db.delete(karateProfiles).where(eq(karateProfiles.profileId, profile.id));

        console.log("Deleting main profile", profile.id);
        await db.delete(profiles).where(eq(profiles.id, profile.id));
    }

    console.log("Deleting neon_auth records...");
    await db.execute(sql`DELETE FROM neon_auth.session WHERE "userId" = ${userId}`);
    await db.execute(sql`DELETE FROM neon_auth.account WHERE "userId" = ${userId}`);
    await db.execute(sql`DELETE FROM neon_auth.user WHERE id = ${userId}`);

    console.log("Successfully wiped all data for", email);
    process.exit(0);
}

main().catch(console.error);
