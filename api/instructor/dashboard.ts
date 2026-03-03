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

        // isInstructor lives on the profiles table (src/db/schema.ts)
        const isInstructor = requesterProfile?.isInstructor || false;

        if (!isInstructor) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        // 1. Total Students
        const studentsCount = await db.select({ count: sql<number>`count(*)` })
            .from(profiles)
            .where(eq(profiles.isStudent, true));

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
