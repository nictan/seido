import 'dotenv/config';
import { db } from '../src/db/index.js';
import { profiles, karateProfiles, gradingPeriods, gradingApplications, rankHistories, ranks } from '../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function main() {
    console.log("Setting up Instructor View Test...");

    try {
        // 1. Promote 'Browser Test' to Instructor
        const browserUser = await db.query.profiles.findFirst({
            where: eq(profiles.email, 'browser.test@seido.sg'),
            with: { karateProfile: true }
        });

        if (!browserUser) {
            console.error("Browser Test user not found. Did you run the signup test?");
            // Create if missing (fallback)
            // But we want to use the logged-in session.
            process.exit(1);
        }

        if (browserUser.karateProfile) {
            await db.update(karateProfiles)
                .set({ isInstructor: true, dojo: 'HQ' })
                .where(eq(karateProfiles.id, browserUser.karateProfile.id));
            console.log(`Promoted ${browserUser.email} to Instructor.`);
        } else {
            console.error("Browser User has no karate profile.");
            process.exit(1);
        }

        // 2. Create Dummy Student Profile (Database only, no Auth needed for viewing)
        const dummyEmail = `dummy.${Date.now()}@student.com`;
        const [dummyProfile] = await db.insert(profiles).values({
            userId: `dummy-${Date.now()}`,
            firstName: 'Dummy',
            lastName: 'Student',
            email: dummyEmail,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        await db.insert(karateProfiles).values({
            profileId: dummyProfile.id,
            dojo: 'HQ',
            isStudent: true
        });

        const rank10 = await db.query.ranks.findFirst({ where: eq(ranks.rankOrder, 10) });
        const rank9 = await db.query.ranks.findFirst({ where: eq(ranks.rankOrder, 9) });

        if (!rank10) throw new Error("Rank 10 not found");

        await db.insert(rankHistories).values({
            profileId: dummyProfile.id,
            rankId: rank10.id,
            effectiveDate: new Date().toISOString(),
            isCurrent: true
        });

        console.log(`Created Dummy Student: ${dummyProfile.firstName}`);

        // 3. Create Grading Application for Dummy Student
        // Find a grading period
        const period = await db.query.gradingPeriods.findFirst({
            orderBy: (gp, { desc }) => [desc(gp.createdAt)]
        });

        if (!period) throw new Error("No grading period found.");

        await db.insert(gradingApplications).values({
            profileId: dummyProfile.id,
            gradingPeriodId: period.id,
            currentRankId: rank10.id,
            proposedRankId: rank9!.id,
            status: 'Submitted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        console.log(`Created Application for Dummy Student in Period: ${period.title}`);

    } catch (error) {
        console.error("Setup Failed:", error);
        process.exit(1);
    }

    console.log("Setup Complete!");
    process.exit(0);
}

main();
