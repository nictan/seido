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

        console.log("Created/Updated Profile:", newProfile.id);
    } catch (err) {
        console.error("DB UPSERT ERROR:", err);
    }
    process.exit(0);
}
main();
