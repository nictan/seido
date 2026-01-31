
import 'dotenv/config'; // Ensure env vars are loaded FIRST
import { db } from '../api/_db.js';
import { profiles, karateProfiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address.');
        process.exit(1);
    }

    console.log(`Promoting user with email: ${email}...`);

    try {
        // 1. Find Profile
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.email, email),
            with: { karateProfile: true }
        });

        if (!profile) {
            console.error('Profile not found for email:', email);
            process.exit(1);
        }

        console.log('Found Profile:', profile.firstName, profile.lastName, 'ID:', profile.id);

        if (!profile.karateProfile) {
            console.error('No Karate Profile found. Creating one...');
            await db.insert(karateProfiles).values({
                profileId: profile.id,
                dojo: 'HQ',
                isStudent: true,
                isInstructor: true
            });
            console.log('Created Karate Profile with Instructor role.');
        } else {
            // 2. Update Karate Profile
            await db.update(karateProfiles)
                .set({ isInstructor: true })
                .where(eq(karateProfiles.profileId, profile.id));
            console.log('Promoted to Instructor successfully.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

main();
