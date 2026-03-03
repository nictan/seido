import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories } from './src/db/schema.js';
import { eq, ilike } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function main() {
    // Find and clean up all test user profiles
    const testProfiles = await db.select().from(profiles).where(ilike(profiles.email, '%testuser_delete_me%'));
    console.log("Test profiles found:", testProfiles.map(p => ({id: p.id, email: p.email})));
    
    for (const profile of testProfiles) {
        // Delete rank histories
        const rh = await db.delete(rankHistories).where(eq(rankHistories.profileId, profile.id)).returning();
        console.log("Deleted rank histories:", rh.length);
        
        // Delete karate profiles
        const kp = await db.delete(karateProfiles).where(eq(karateProfiles.profileId, profile.id)).returning();
        console.log("Deleted karate profiles:", kp.length);
        
        // Delete profile
        await db.delete(profiles).where(eq(profiles.id, profile.id));
        console.log("Deleted profile:", profile.id);
    }

    // Also clean up test auth users via Neon auth tables if they exist
    try {
        const result = await db.execute(sql`DELETE FROM "auth"."users" WHERE email ILIKE '%testuser_delete_me%' RETURNING email`);
        console.log("Deleted auth users:", result.rows);
    } catch (e: any) {
        console.log("No auth table found (expected):", e.message);
    }

    console.log("Cleanup complete!");
    process.exit(0);
}
main();
