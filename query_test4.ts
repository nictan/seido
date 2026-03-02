// To run: export $(grep -v '^#' .env.local | xargs) && npx tsx query_test4.ts
import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories, ranks } from './src/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';

async function main() {
    const userId = '9435c688-9e38-4cfd-98e5-ca65b09ad3b5'; // nicorasu.tan@gmail.com

    console.log("Attempting to insert profile for", userId);

    try {
        const [newProfile] = await db.insert(profiles).values({
            userId,
            firstName: "Nicholas",
            lastName: "Tan",
            email: "nicorasu.tan@gmail.com",
            dateOfBirth: "1990-01-01",
            mobile: "12345678",
            gender: "Male",
            emergencyContactName: "Test",
            emergencyContactRelationship: "Test",
            emergencyContactPhone: "12345678",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        console.log("Success inserting profile:", newProfile.id);

        await db.insert(karateProfiles).values({
            profileId: newProfile.id,
            dojo: 'HQ',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        console.log("Success inserting karateProfile");

        const defaultRank = await db.query.ranks.findFirst({
            where: (ranks, { eq }) => eq(ranks.isDefaultRank, true)
        });

        let defaultRankId = defaultRank?.id;
        if (!defaultRankId) {
            const whiteBeltRequest = await db.query.ranks.findFirst({
                where: (ranks, { or, ilike }) => or(ilike(ranks.displayName, 'White Belt'), ilike(ranks.displayName, '%White%'))
            });
            defaultRankId = whiteBeltRequest?.id;
        }

        if (!defaultRankId) {
            console.error("No default rank found!");
            process.exit(1);
        }

        await db.insert(rankHistories).values({
            profileId: newProfile.id,
            rankId: defaultRankId,
            effectiveDate: new Date().toISOString().split('T')[0],
            isCurrent: true,
        });

        console.log("Success inserting rankHistory!");

    } catch (err) {
        console.error("Failed:", err);
    }
    process.exit(0);
}
main();
