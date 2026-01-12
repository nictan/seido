import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyAuth } from './_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const requesterId = payload.sub as string;

    try {
        const requesterProfile = await db.select().from(profiles).where(eq(profiles.userId, requesterId));

        if (requesterProfile.length === 0 || !requesterProfile[0].isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const allProfiles = await db.select({
            id: profiles.id,
            userId: profiles.userId,
            email: profiles.email,
            firstName: profiles.firstName,
            lastName: profiles.lastName
        }).from(profiles);

        return new Response(JSON.stringify(allProfiles), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Database error', details: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
