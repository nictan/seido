import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories, ranks } from './src/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';

async function main() {
    const userId = "test-uuid-prod-error";
    const firstName = "Nicholas";
    const lastName = "Tan";
    const email = "nicorasu.tan@gmail.com";
    const dateOfBirth = "2026-03-02";
    const gender = "Female";
    const mobile = "92398828";
    const remarks = "";
    const emergencyContactName = "ki";
    const emergencyContactRelationship = "a";
    const emergencyContactPhone = "90123456";
    const emergencyContactEmail = "";
    const dojo = "HQ";

    try {
        console.log('Upserting profiles...');
        const [newProfile] = await db.insert(profiles).values({
            userId,
            firstName,
            lastName,
            email,
            dateOfBirth,
            mobile,
            gender,
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
                gender,
                emergencyContactName,
                emergencyContactRelationship,
                emergencyContactPhone,
                emergencyContactEmail,
                remarks,
                updatedAt: new Date().toISOString(),
            }
        }).returning();
        console.log('Profile upserted:', newProfile.id);

        console.log('Upserting karateProfiles...');
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
        console.log('Karate Profile upserted');

        const defaultRank = await db.query.ranks.findFirst({
            where: (ranks, { eq }) => eq(ranks.isDefaultRank, true)
        });
        let defaultRankId = defaultRank?.id;

        const existingRank = await db.query.rankHistories.findFirst({
            where: (rh, { eq }) => eq(rh.profileId, newProfile.id)
        });

        if (!existingRank && defaultRankId) {
            console.log('Inserting default rank...');
            await db.insert(rankHistories).values({
                profileId: newProfile.id,
                rankId: defaultRankId,
                effectiveDate: new Date().toISOString().split('T')[0],
                isCurrent: true,
            });
            console.log('Rank history inserted');
        }

        console.log("SUCCESS!", newProfile.id);
    } catch (err: any) {
        console.error("DB UPSERT ERROR:");
        console.log(err);
        console.log("code:", err.code);
        console.log("detail:", err.detail);
        console.log("message:", err.message);
    }
    process.exit(0);
}
main();
