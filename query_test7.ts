import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories, ranks } from './src/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';

async function main() {
    const userId = "9435c688-9e38-4cfd-98e5-ca65b09ad3b5";
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

    try {
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
        }).returning();

        console.log("Created Profile:", newProfile.id);

        await db.insert(karateProfiles).values({
            profileId: newProfile.id,
            dojo: 'HQ',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        console.log("Created Karate Profile");
    } catch (err) {
        console.error("DB INSERT ERROR:", err);
    }

    process.exit(0);
}
main();
