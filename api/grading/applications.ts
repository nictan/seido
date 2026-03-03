import { db } from '../_db.js';
import { gradingApplications, profiles, rankHistories } from '../../src/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth } from '../_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const requesterId = payload.sub as string;

    try {
        // Get Profile ID for this User (requester)
        const requesterProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, requesterId),
        });

        if (!requesterProfile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (request.method === 'GET') {
            const { searchParams } = new URL(request.url);
            const userId = searchParams.get('userId');

            // Re-fetch requester to check admin
            const requesterFullProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, requesterId),
            });
            const isInstructor = requesterFullProfile?.isInstructor || false;

            let queryFilters = [];

            if (userId) {
                // Determine profileId for the requested userId
                const targetProfile = await db.query.profiles.findFirst({
                    where: eq(profiles.userId, userId)
                });
                if (!targetProfile) {
                    return new Response(JSON.stringify([]), { status: 200 });
                }

                // Security check: can only view own unless instructor
                if (requesterId !== userId && !isInstructor) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
                }

                queryFilters.push(eq(gradingApplications.profileId, targetProfile.id));
            } else {
                // No userId provided.
                if (!isInstructor) {
                    // Default behavior for students: only show their own applications.
                    const targetProfile = await db.query.profiles.findFirst({
                        where: eq(profiles.userId, requesterId)
                    });

                    if (!targetProfile) {
                        // Authenticated user but no profile -> No apps can exist for them.
                        return new Response(JSON.stringify([]), { status: 200 });
                    }

                    queryFilters.push(eq(gradingApplications.profileId, targetProfile.id));
                }
                // If instructor, we leave queryFilters empty (returns all).
            }

            const apps = await db.query.gradingApplications.findMany({
                where: queryFilters.length ? and(...queryFilters) : undefined,
                with: {
                    gradingPeriod: true,
                    profile: { // Include profile for instructor view
                        with: { karateProfile: true }
                    },
                    currentRank: true, // Keep these for all views
                    proposedRank: true // Keep these for all views
                },
                orderBy: [desc(gradingApplications.createdAt)]
            });

            return new Response(JSON.stringify(apps), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const { gradingPeriodId, currentRankId, proposedRankId, instructorNotes } = body;

            // Validation
            if (!gradingPeriodId || !currentRankId || !proposedRankId) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check for existing active application for this period
            const existingApps = await db.select().from(gradingApplications)
                .where(and(
                    eq(gradingApplications.gradingPeriodId, gradingPeriodId),
                    eq(gradingApplications.profileId, requesterProfile.id)
                ));

            const activeApp = existingApps.find(app =>
                app.status === 'Submitted' ||
                app.status === 'Approved'
            );

            if (activeApp) {
                return new Response(JSON.stringify({ error: 'You have already applied for this grading period.' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                const [newApp] = await db.insert(gradingApplications).values({
                    profileId: requesterProfile.id,
                    gradingPeriodId,
                    currentRankId,
                    proposedRankId,
                    instructorNotes,
                    status: 'Submitted',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }).returning();

                return new Response(JSON.stringify(newApp), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err: any) {
                console.error('API: Grading Application POST - Error:', err);
                return new Response(JSON.stringify({ error: err.message, detail: err.detail }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { id, status, gradingStatus, gradingNotes } = body;

            // Updated valid statuses including gradingStatus updates
            const validStatuses = ['Withdrawn', 'Approved', 'Rejected'];

            // Allow update if status is valid OR if we are updating gradingStatus
            if (status && !validStatuses.includes(status)) {
                return new Response(JSON.stringify({ error: 'Invalid status update' }), { status: 400 });
            }

            const app = await db.query.gradingApplications.findFirst({
                where: eq(gradingApplications.id, id),
                with: { profile: true }
            });

            if (!app) {
                return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
            }

            const isOwner = app.profileId === requesterProfile.id;

            const requesterFull = await db.query.profiles.findFirst({
                where: eq(profiles.userId, requesterId),
            });
            const isInstructor = requesterFull?.isInstructor || false;

            if (status === 'Withdrawn') {
                if (!isOwner && !isInstructor) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
                }

                await db.update(gradingApplications)
                    .set({ status: 'Withdrawn', updatedAt: new Date().toISOString() })
                    .where(eq(gradingApplications.id, id));

            } else {
                if (!isInstructor) {
                    return new Response(JSON.stringify({ error: 'Forbidden: Instructor only' }), { status: 403 });
                }

                if (gradingStatus) {
                    // Handle Grading Result (Pass/Fail)
                    if (gradingStatus === 'Pass') {
                        // 1. Update Application Status
                        await db.update(gradingApplications)
                            .set({
                                gradingStatus: 'Pass',
                                gradingNotes: gradingNotes || null,
                                updatedAt: new Date().toISOString()
                            })
                            .where(eq(gradingApplications.id, id));

                        // 2. Deactivate Old Rank
                        await db.update(rankHistories)
                            .set({ isCurrent: false })
                            .where(and(
                                eq(rankHistories.profileId, app.profileId),
                                eq(rankHistories.isCurrent, true)
                            ));

                        // 3. Insert New Rank (Promotion)
                        await db.insert(rankHistories).values({
                            profileId: app.profileId,
                            rankId: app.proposedRankId,
                            effectiveDate: new Date().toISOString().split('T')[0],
                            isCurrent: true
                        });
                    } else if (gradingStatus === 'Fail') {
                        await db.update(gradingApplications)
                            .set({
                                gradingStatus: 'Fail',
                                gradingNotes: gradingNotes || null,
                                updatedAt: new Date().toISOString()
                            })
                            .where(eq(gradingApplications.id, id));
                    }
                } else if (status === 'Rejected') {
                    await db.update(gradingApplications)
                        .set({ status: 'Rejected', updatedAt: new Date().toISOString() })
                        .where(eq(gradingApplications.id, id));
                } else if (status === 'Approved') {
                    // Just Approve (Authorize Exam), DO NOT PROMOTE
                    await db.update(gradingApplications)
                        .set({ status: 'Approved', updatedAt: new Date().toISOString() })
                        .where(eq(gradingApplications.id, id));
                }
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error: any) {
        console.error('API: Grading Applications - Outer error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
