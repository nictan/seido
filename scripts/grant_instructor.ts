import { db } from '../src/db/index.js';
import { karateProfiles, profiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    // Update all karate profiles to be instructors for the purpose of testing
    // Or, if you want to target a specific user, you'd find them first.
    // Let's just update the most recently created profile.

    console.log("Updating latest profile to be instructor...");

    // Find latest profile
    const latestProfile = await db.query.profiles.findFirst({
        orderBy: (profiles, { desc }) => [desc(profiles.createdAt)],
        with: { karateProfile: true }
    });

    if (!latestProfile) {
        console.error("No profiles found.");
        process.exit(1);
    }

    console.log(`Found profile: ${latestProfile.firstName} ${latestProfile.lastName} (${latestProfile.email})`);

    if (latestProfile.karateProfile) {
        await db.update(karateProfiles)
            .set({ isInstructor: true })
            .where(eq(karateProfiles.id, latestProfile.karateProfile.id));
        console.log("Updated karate profile to isInstructor=true");
    } else {
        console.error("No karate profile found for this user.");
    }

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
