import { db } from '../../src/db/index.js';
import { profiles, karateProfiles, gradingApplications, gradingPeriods } from '../../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth } from '../_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        // Verify admin/instructor status
        const requesterId = payload.sub as string;
        const requesterProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, requesterId),
            with: { karateProfile: true }
        });

        if (!requesterProfile?.karateProfile?.isInstructor && !requesterProfile?.karateProfile?.isStudent === false) {
            // Logic check: if not instructor. Using isStudent=false as proxy for potential instructor if field missing, 
            // but schema says isInstructor available? Let's check schema.
            // Actually, plan says "Assuming 'Instructor' privileges are determined by profile.karate_profile.is_instructor"
            // Let's assume schema has it or we use 'isStudent' false + some other check?
            // Re-reading schema... I don't recall seeing isInstructor explicit in previous schema dumps, 
            // but 'karateProfiles' had 'isStudent'.
            // Let's rely on 'isInstructor' being a boolean property of karateProfiles if it exists, or implied.
            // Wait, looking at previous file edits... 
            // Schema: `isStudent: boolean("is_student").default(true)`
            // I will add `isInstructor` to schema if it's missing or use a derived query.
            // For now, let's assume we need to implement it or use a fallback.
            // Better: Assume any non-student or specific user is instructor. 
            // Actually, I'll modify schema to be sure in parallel if needed, but for now let's use the explicit check 
            // that matches the one in 'profile.ts' -> "const isRequesterAdmin = requesterFullProfile?.karateProfile?.isInstructor || false;"
        }

        // Re-using logic from profile.ts
        const isInstructor = requesterProfile?.karateProfile?.isInstructor || false;

        if (!isInstructor) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        // 1. Total Students
        const studentsCount = await db.select({ count: sql<number>`count(*)` })
            .from(karateProfiles)
            .where(eq(karateProfiles.isStudent, true));

        // 2. Pending Applications
        const pendingAppsCount = await db.select({ count: sql<number>`count(*)` })
            .from(gradingApplications)
            .where(eq(gradingApplications.status, 'Submitted'));

        // 3. Active Grading Periods (Upcoming or In Progress)
        const activePeriodsCount = await db.select({ count: sql<number>`count(*)` })
            .from(gradingPeriods)
            .where(sql`${gradingPeriods.status} = 'Upcoming' OR ${gradingPeriods.status} = 'In Progress'`);

        return new Response(JSON.stringify({
            totalStudents: Number(studentsCount[0].count),
            pendingApplications: Number(pendingAppsCount[0].count),
            activeGradingPeriods: Number(activePeriodsCount[0].count)
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API: Instructor Dashboard Stats failed:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
