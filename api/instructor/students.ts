import { db } from '../../src/db/index.js';
import { profiles, karateProfiles, rankHistories, ranks } from '../../src/db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { verifyAuth } from '../_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const requesterId = payload.sub as string;
        const requesterProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, requesterId),
            with: { karateProfile: true }
        });

        const isInstructor = requesterProfile?.isInstructor || false;
        const isAdmin = requesterProfile?.isAdmin || false;

        if (!isInstructor && !isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        if (request.method === 'GET') {
            const students = await db.query.profiles.findMany({
                with: {
                    karateProfile: true,
                    rankHistories: {
                        where: eq(rankHistories.isCurrent, true),
                        with: {
                            rank: true
                        },
                        limit: 1
                    }
                }
            });

            // Filter out profiles that don't have a karateProfile
            const studentList = students
                .filter(p => p.karateProfile)
                .map(p => ({
                    id: p.id,
                    userId: p.userId,
                    firstName: p.firstName,
                    lastName: p.lastName,
                    email: p.email,
                    mobile: p.mobile,
                    dojo: p.karateProfile?.dojo,
                    currentRank: p.rankHistories[0]?.rank?.displayName || 'Unranked',
                    rankColor: p.rankHistories[0]?.rank?.beltColor || '#fff'
                }));

            return new Response(JSON.stringify(studentList), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (request.method === 'PUT') {
            const { studentId, email, mobile, dojo, rank } = await request.json();

            if (!studentId) {
                return new Response(JSON.stringify({ error: 'Student ID required' }), { status: 400 });
            }

            const student = await db.query.profiles.findFirst({
                where: eq(profiles.id, studentId),
            });

            if (!student) {
                return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404 });
            }

            // Check email uniqueness if changed
            if (email && email !== student.email) {
                const existing = await db.query.profiles.findFirst({
                    where: eq(profiles.email, email)
                });
                if (existing && existing.id !== studentId) {
                    return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
                }
            }

            // 1. Update Profile
            await db.update(profiles)
                .set({
                    email,
                    mobile
                })
                .where(eq(profiles.id, studentId));

            // 2. Update Auth Email
            if (email && email !== student.email) {
                try {
                    await db.execute(sql`UPDATE neon_auth.users SET email = ${email} WHERE id = ${student.userId}`);
                } catch (e) {
                    console.error("Failed to update auth email", e);
                }
            }

            // 3. Update Dojo
            if (dojo) {
                await db.update(karateProfiles)
                    .set({ dojo })
                    .where(eq(karateProfiles.profileId, studentId));
            }

            // 4. Update Rank
            if (rank) {
                const targetRank = await db.query.ranks.findFirst({
                    where: eq(ranks.displayName, rank)
                });

                if (targetRank) {
                    // Update old
                    await db.update(rankHistories)
                        .set({ isCurrent: false })
                        .where(eq(rankHistories.profileId, studentId));

                    // Insert new
                    await db.insert(rankHistories).values({
                        profileId: studentId,
                        rankId: targetRank.id,
                        isCurrent: true,
                        effectiveDate: new Date().toISOString().split('T')[0]
                    });
                }
            }

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    } catch (error) {
        console.error('API: Instructor Students Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
