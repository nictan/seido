import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories, ranks } from './src/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';

async function main() {
    const userId = "new-uuid-1234";
    const firstName = "Nicholas";
    const lastName = "Tan";
    const email = "nicorasu.tan@gmail.com";
    const dateOfBirth = "1996-01-01";
    const gender = "Male";
    const mobile = "92398828";
    const remarks = "testing test";
    const emergencyContactName = "Li";
    const emergencyContactRelationship = "Wife";
    const emergencyContactPhone = "91234567";
    const emergencyContactEmail = "";
    const dojo = "HQ";

    try {
        const [newProfile] = await db.insert(profiles).values({
            userId,
            firstName,
            lastName,
            email,
            dateOfBirth,
            mobile,
            gender: "Male",
            emergencyContactName,
            emergencyContactRelationship,
            emergencyContactPhone,
            emergencyContactEmail,
            remarks,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).onConflictDoUpdate({
            target: profiles.email,
            set: {
                userId,
                firstName,
                lastName,
                dateOfBirth,
                mobile,
                gender: "Male",
                emergencyContactName,
                emergencyContactRelationship,
                emergencyContactPhone,
                emergencyContactEmail,
                remarks,
                updatedAt: new Date().toISOString(),
            }
        }).returning();

        await db.insert(karateProfiles).values({
            profileId: newProfile.id,
            dojo: dojo || 'HQ',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).onConflictDoUpdate({
            target: karateProfiles.profileId,
            set: {
                dojo: dojo || 'HQ',
                updatedAt: new Date().toISOString(),
            }
        });

        const defaultRank = await db.query.ranks.findFirst({
            where: (ranks, { eq }) => eq(ranks.isDefaultRank, true)
        });
        let defaultRankId = defaultRank?.id;

        const existingRank = await db.query.rankHistories.findFirst({
            where: (rh, { eq }) => eq(rh.profileId, newProfile.id)
        });

        if (!existingRank && defaultRankId) {
            await db.insert(rankHistories).values({
                profileId: newProfile.id,
                rankId: defaultRankId,
                effectiveDate: new Date().toISOString().split('T')[0],
                isCurrent: true,
            });
        }

        console.log("SUCCESS!", newProfile.id);
    } catch (err) {
        console.error("DB UPSERT ERROR:", err);
    }
    process.exit(0);
}
main();
