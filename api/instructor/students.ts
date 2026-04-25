import { db } from '../_db.js';
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
            const result = await db.execute(sql`
                SELECT 
                    p.id,
                    p.user_id as "userId",
                    p.first_name as "firstName",
                    p.last_name as "lastName",
                    p.email,
                    p.mobile,
                    p.waiver_accepted_at as "waiverAcceptedAt",
                    kp.dojo,
                    r.display_name as "currentRank",
                    r.belt_color as "rankColor"
                FROM profiles p
                INNER JOIN karate_profiles kp ON kp.profile_id = p.id
                LEFT JOIN rank_histories rh ON rh.profile_id = p.id AND rh.is_current = true
                LEFT JOIN ranks r ON r.id = rh.rank_id
                ORDER BY p.first_name ASC
            `);

            const studentList = result.rows.map(row => ({
                id: row.id,
                userId: row.userId,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                mobile: row.mobile,
                dojo: row.dojo,
                currentRank: row.currentRank || 'Unranked',
                rankColor: row.rankColor || '#fff',
                waiverAcceptedAt: row.waiverAcceptedAt ?? null,
                // Removed waiverPdfData to prevent payload size errors
                waiverPdfData: null,
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
