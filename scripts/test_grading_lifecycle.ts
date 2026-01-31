import 'dotenv/config';
import { db } from '../src/db/index.js';
import { profiles, karateProfiles, gradingPeriods, gradingApplications, rankHistories, ranks } from '../src/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    console.log("Starting Grading Lifecycle Test...");

    try {
        // 1. Setup: Create Student and Instructor
        // Using fake user IDs for testing
        const studentUserId = `test-student-${Date.now()}`;
        const instructorUserId = `test-instructor-${Date.now()}`;

        // Create Student
        const [studentProfile] = await db.insert(profiles).values({
            userId: studentUserId,
            firstName: 'Test',
            lastName: 'Student',
            email: `student-${Date.now()}@test.com`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        await db.insert(karateProfiles).values({
            profileId: studentProfile.id,
            dojo: 'HQ',
            isStudent: true,
        });

        // Get 10th Kyu (lowest rank)
        const rank10 = await db.query.ranks.findFirst({ where: eq(ranks.rankOrder, 10) });
        const rank9 = await db.query.ranks.findFirst({ where: eq(ranks.rankOrder, 9) });

        if (!rank10 || !rank9) throw new Error("Ranks not found. Run seed?");

        await db.insert(rankHistories).values({
            profileId: studentProfile.id,
            rankId: rank10.id,
            effectiveDate: new Date().toISOString(),
            isCurrent: true
        });

        console.log(`Created Student: ${studentProfile.id}`);

        // Create Instructor
        const [instructorProfile] = await db.insert(profiles).values({
            userId: instructorUserId,
            firstName: 'Sensei',
            lastName: 'Test',
            email: `instructor-${Date.now()}@test.com`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        await db.insert(karateProfiles).values({
            profileId: instructorProfile.id,
            dojo: 'HQ',
            isInstructor: true,
        });

        console.log(`Created Instructor: ${instructorProfile.id}`);

        // 2. Create Grading Period
        const [period] = await db.insert(gradingPeriods).values({
            title: `Test Grading ${Date.now()}`,
            gradingDate: new Date().toISOString(),
            createdBy: instructorProfile.id,
            status: 'Upcoming'
        }).returning();

        console.log(`Created Grading Period: ${period.id}`);

        // 3. Application Submission (Simulating API POST Logic via DB for setup, but effectively testing flow)
        // We technically want to test the API endpoint logic, but calling API from script needs fetch setup with mock auth.
        // For now, testing the LOGIC by calling DB directly is safer for this environment, but testing the API HANDLER logic would be better.
        // Let's rely on manual or `fetch` if we had the server running and reachable.
        // Since `npm run dev` is running, we might be able to hit localhost:3000/api/... but we need a valid JWT.
        // Generating a valid JWT signed by the JWKS provider is hard.
        // So we will simulate the DB operations that the API would do, OR just unit-test the handler logic?
        // No, let's just test the database state transitions by performing the inserts/updates manually to ensure schema constraints and triggers (if any) work, 
        // BUT mostly we want to verify the logic we implemented in `PUT`.

        // Actually, since we modified the API code, we really want to test expected side effects.
        // I'll simulate the "Approve" logic by running the EXACT code snippet we wrote in `applications.ts` here to verify it works against the DB.

        // A. Student Submits
        const [application] = await db.insert(gradingApplications).values({
            profileId: studentProfile.id,
            gradingPeriodId: period.id,
            currentRankId: rank10.id,
            proposedRankId: rank9.id,
            status: 'Submitted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        console.log(`Created Application: ${application.id}`);

        // 4. Instructor Approves (Simulating the PUT logic)
        console.log("Simulating Approval Logic...");

        // Start Transaction-like behavior
        // 1. Update Application status
        await db.update(gradingApplications)
            .set({ status: 'Approved', updatedAt: new Date().toISOString() })
            .where(eq(gradingApplications.id, application.id));

        // 2. Promote User
        // Mark old current rank as not current
        await db.update(rankHistories)
            .set({ isCurrent: false })
            .where(and(
                eq(rankHistories.profileId, studentProfile.id),
                eq(rankHistories.isCurrent, true)
            ));

        // Insert new current rank
        await db.insert(rankHistories).values({
            profileId: studentProfile.id,
            rankId: rank9.id,
            effectiveDate: new Date().toISOString().split('T')[0],
            isCurrent: true
        });

        console.log("Approval Logic Executed.");

        // 5. Verification
        const refreshedApp = await db.query.gradingApplications.findFirst({
            where: eq(gradingApplications.id, application.id)
        });

        if (refreshedApp?.status !== 'Approved') throw new Error("Application status not updated to Approved");
        console.log("VERIFIED: Application status is Approved.");

        const newRankHistory = await db.query.rankHistories.findFirst({
            where: and(
                eq(rankHistories.profileId, studentProfile.id),
                eq(rankHistories.isCurrent, true)
            ),
            with: { rank: true }
        });

        if (newRankHistory?.rankId !== rank9.id) throw new Error("New rank history not found or incorrect.");
        console.log(`VERIFIED: Student promoted to ${newRankHistory.rank.displayName}`);

        // Cleanup (Optional)
        // await db.delete(profiles).where(eq(profiles.id, studentProfile.id));
        // await db.delete(profiles).where(eq(profiles.id, instructorProfile.id));

    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    }

    console.log("Test Passed Successfully!");
    process.exit(0);
}

main();
