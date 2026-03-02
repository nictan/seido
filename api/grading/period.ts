import { db } from '../../src/db/index.js';
import { gradingPeriods, gradingPeriodRanks, profiles } from '../../src/db/schema.js';
import { eq, desc, and, or } from 'drizzle-orm';
import { verifyAuth } from '../_auth.js';


export default async function handler(request: Request) {
    if (request.method === 'GET') {
        try {
            // Fetch available grading periods (Upcoming or In Progress)
            const periods = await db.query.gradingPeriods.findMany({
                where: or(
                    eq(gradingPeriods.status, 'Upcoming'),
                    eq(gradingPeriods.status, 'In Progress')
                ),
                orderBy: desc(gradingPeriods.gradingDate),
                with: {
                    allowedRanks: {
                        with: {
                            rank: true
                        }
                    }
                }
            });

            return new Response(JSON.stringify(periods), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error: any) {
            console.error('API: Grading Periods GET - Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (request.method === 'POST') {
        try {
            const payload = await verifyAuth(request);
            if (!payload) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
            }

            // Check if instructor/admin
            const requesterId = payload.sub as string;
            const requesterProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, requesterId),
                with: { karateProfile: true }
            });

            if (!requesterProfile?.isInstructor) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
            }

            const body = await request.json();
            const { title, gradingDate, description, maxApplications, allowedRankIds } = body;

            if (!title || !gradingDate) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
            }

            const [newPeriod] = await db.insert(gradingPeriods).values({
                title,
                gradingDate,
                description,
                maxApplications: maxApplications || 20,
                createdBy: requesterProfile.id,
                status: 'Upcoming'
            }).returning();

            // Insert allowed ranks if provided
            if (allowedRankIds && Array.isArray(allowedRankIds) && allowedRankIds.length > 0) {
                await db.insert(gradingPeriodRanks).values(
                    allowedRankIds.map((rankId: string) => ({
                        gradingPeriodId: newPeriod.id,
                        rankId: rankId
                    }))
                );
            }

            return new Response(JSON.stringify(newPeriod), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error: any) {
            console.error('API: Grading Periods POST - Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    if (request.method === 'PUT') {
        try {
            const payload = await verifyAuth(request);
            if (!payload) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
            }

            const requesterId = payload.sub as string;
            const requesterProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, requesterId),
                with: { karateProfile: true }
            });

            if (!requesterProfile?.isInstructor) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
            }

            const body = await request.json();
            const { id, title, gradingDate, description, maxApplications, allowedRankIds } = body;

            if (!id || !title || !gradingDate) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
            }

            // Update Period Details
            const [updatedPeriod] = await db.update(gradingPeriods)
                .set({
                    title,
                    gradingDate,
                    description,
                    maxApplications: maxApplications || 20,
                    // status can be updated via a separate endpoint if needed, or included here. 
                    // For now, let's assume status management is separate or we keep it as is.
                })
                .where(eq(gradingPeriods.id, id))
                .returning();

            if (!updatedPeriod) {
                return new Response(JSON.stringify({ error: 'Grading period not found' }), { status: 404 });
            }

            // Update Ranks: Full Replace Strategy
            // 1. Delete existing ranks
            await db.delete(gradingPeriodRanks).where(eq(gradingPeriodRanks.gradingPeriodId, id));

            // 2. Insert new allowed ranks
            if (allowedRankIds && Array.isArray(allowedRankIds) && allowedRankIds.length > 0) {
                await db.insert(gradingPeriodRanks).values(
                    allowedRankIds.map((rankId: string) => ({
                        gradingPeriodId: id,
                        rankId: rankId
                    }))
                );
            }

            return new Response(JSON.stringify(updatedPeriod), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error: any) {
            console.error('API: Grading Periods PUT - Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
