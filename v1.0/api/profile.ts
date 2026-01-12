import { db } from './_db.js';
import { profiles, karateProfiles, rankHistories } from '../src/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth } from './_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const payload = await verifyAuth(request);
        const userId = url.searchParams.get('userId');

        if (!payload) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const requesterId = payload.sub as string;
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Missing userId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // Check if requester is admin or requesting own profile
            const requesterFullProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, requesterId),
                with: { karateProfile: true }
            });

            const isRequesterAdmin = requesterFullProfile?.karateProfile?.isInstructor || false;

            if (requesterId !== userId && !isRequesterAdmin) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const result = await db.query.profiles.findFirst({
                where: eq(profiles.userId, userId),
                with: {
                    karateProfile: true,
                    rankHistories: {
                        with: { rank: true },
                        orderBy: [desc(rankHistories.effectiveDate)],
                        limit: 10
                    }
                }
            });

            if (!result) {
                return new Response(JSON.stringify({ error: 'Profile not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Database error', details: String(error) }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (request.method === 'POST') {
        try {
            const authHeader = request.headers.get('Authorization');
            console.log('API: Profile POST - Authorization header present:', !!authHeader);

            const payload = await verifyAuth(request);
            if (!payload) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const body = await request.json();

            const {
                firstName, lastName, email,
                dateOfBirth, mobile, gender,
                emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
                dojo, rankId
            } = body;

            const userId = payload.sub as string;

            // Simple validation
            const missingFields = [];
            if (!userId) missingFields.push('userId (from token sub)');
            if (!firstName) missingFields.push('firstName');
            if (!lastName) missingFields.push('lastName');
            if (!email) missingFields.push('email');

            /*
            if (!dateOfBirth) missingFields.push('dateOfBirth');
            if (!mobile) missingFields.push('mobile');
            if (!gender) missingFields.push('gender');
            */

            if (missingFields.length > 0) {
                return new Response(JSON.stringify({
                    error: 'Missing required fields',
                    missing: missingFields,
                    received: { firstName: !!firstName, lastName: !!lastName, email: !!email, userId: !!userId }
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // 1. Create Profile
                const [newProfile] = await db.insert(profiles).values({
                    userId,
                    firstName,
                    lastName,
                    email,
                    dateOfBirth,
                    mobile,
                    gender,
                    emergencyContactName,
                    emergencyContactRelationship,
                    emergencyContactPhone,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }).returning();

                // 2. Create Karate Profile
                await db.insert(karateProfiles).values({
                    profileId: newProfile.id,
                    dojo: dojo || 'HQ',
                    isStudent: true,
                });

                // 3. Create initial Rank History (Default if not provided)
                const defaultRankId = "f255b2d1-2fde-454d-b1ac-10456ffe0385";
                await db.insert(rankHistories).values({
                    profileId: newProfile.id,
                    rankId: rankId || defaultRankId,
                    effectiveDate: new Date().toISOString().split('T')[0],
                    isCurrent: true,
                });

                const result = newProfile;

                return new Response(JSON.stringify(result), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error: any) {
                console.error('API: Profile POST - Transaction failed:', error);
                return new Response(JSON.stringify({
                    error: 'Database transaction failed',
                    message: error.message,
                    code: error.code,
                    detail: error.detail
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (error: any) {
            console.error('API: Profile POST - Outer error:', error);
            return new Response(JSON.stringify({
                error: 'Internal server error',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (request.method === 'PUT') {
        try {
            const payload = await verifyAuth(request);
            if (!payload) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const body = await request.json();
            const { userId, karateProfile: kpUpdates, rankId: newRankId, ...profileUpdates } = body;

            if (!userId) {
                return new Response(JSON.stringify({ error: 'Missing userId' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const currentProfileData = await db.query.profiles.findFirst({
                where: eq(profiles.userId, userId),
                with: {
                    karateProfile: true,
                    rankHistories: {
                        where: eq(rankHistories.isCurrent, true)
                    }
                }
            });

            if (!currentProfileData) throw new Error("Profile not found");

            const [updatedProfile] = await db.update(profiles)
                .set({ ...profileUpdates, updatedAt: new Date().toISOString() })
                .where(eq(profiles.userId, userId))
                .returning();

            if (kpUpdates) {
                await db.update(karateProfiles)
                    .set({ ...kpUpdates, updatedAt: new Date().toISOString() })
                    .where(eq(karateProfiles.profileId, currentProfileData.id));
            }

            const currentRank = currentProfileData.rankHistories?.[0];
            if (newRankId && newRankId !== currentRank?.rankId) {
                await db.update(rankHistories)
                    .set({ isCurrent: false })
                    .where(and(eq(rankHistories.profileId, currentProfileData.id), eq(rankHistories.isCurrent, true)));

                await db.insert(rankHistories).values({
                    profileId: currentProfileData.id,
                    rankId: newRankId,
                    effectiveDate: new Date().toISOString().split('T')[0],
                    isCurrent: true
                });
            }

            const result = updatedProfile;

            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Update failed', details: String(error) }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
}
