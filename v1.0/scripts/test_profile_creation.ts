import 'dotenv/config';
import { db } from '../src/db/index.js';
import { profiles, karateProfiles, rankHistories, ranks } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    console.log("Starting Profile Creation Logic Test...");

    const userId = `test-user-${Date.now()}`;
    const email = `test-user-${Date.now()}@test.com`;

    try {
        // Simulate the logic in api/profile.ts POST handler
        console.log("Simulating Profile Creation Transaction...");

        // 1. Create Profile
        const [newProfile] = await db.insert(profiles).values({
            userId,
            firstName: 'New',
            lastName: 'User',
            email,
            dateOfBirth: '1990-01-01',
            mobile: '1234567890',
            gender: 'Male',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        // 2. Create Karate Profile
        await db.insert(karateProfiles).values({
            profileId: newProfile.id,
            dojo: 'HQ',
            isStudent: true,
        });

        // 3. Create initial Rank History (Default)
        // Need to find a valid rank ID first, similar to how the app would use a default or selected one
        // The API uses hardcoded "f255b2d1-2fde-454d-b1ac-10456ffe0385" if not provided, assuming it exists.
        // Let's look up the 10th Kyu rank instead to be safe, like robust code should.
        const defaultRank = await db.query.ranks.findFirst({
            where: eq(ranks.rankOrder, 10)
        });

        if (!defaultRank) throw new Error("Default Rank (10th Kyu) not found in DB.");

        await db.insert(rankHistories).values({
            profileId: newProfile.id,
            rankId: defaultRank.id,
            effectiveDate: new Date().toISOString().split('T')[0],
            isCurrent: true,
        });

        console.log(`Profile Created: ${newProfile.id}`);

        // Verification
        const fullProfile = await db.query.profiles.findFirst({
            where: eq(profiles.id, newProfile.id),
            with: {
                karateProfile: true,
                rankHistories: {
                    with: { rank: true }
                }
            }
        });

        if (!fullProfile) throw new Error("Profile verify failed: not found");
        if (!fullProfile.karateProfile) throw new Error("Profile verify failed: no karate profile");
        if (fullProfile.rankHistories.length === 0) throw new Error("Profile verify failed: no rank history");
        if (fullProfile.rankHistories[0].rank.rankOrder !== 10) throw new Error("Profile verify failed: wrong rank");

        console.log("VERIFIED: Profile created with Karate Profile and Initial Rank.");

        // Cleanup
        await db.delete(profiles).where(eq(profiles.id, newProfile.id));
        console.log("Cleanup: Test profile deleted.");

    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    }

    console.log("Test Passed Successfully!");
    process.exit(0);
}

main();
