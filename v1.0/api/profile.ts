import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyAuth } from './_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const payload = await verifyAuth(request);
        const userId = url.searchParams.get('userId');

        if (!payload || payload.sub !== userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Missing userId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const result = await db.select().from(profiles).where(eq(profiles.userId, userId));

            if (result.length === 0) {
                return new Response(JSON.stringify({ error: 'Profile not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify(result[0]), {
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
            const payload = await verifyAuth(request);
            const body = await request.json();
            const { userId, firstName, lastName, email } = body;

            if (!payload || payload.sub !== userId) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!userId || !firstName || !lastName || !email) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if profile already exists for this user ID
            const existing = await db.select().from(profiles).where(eq(profiles.userId, userId));
            if (existing.length > 0) {
                return new Response(JSON.stringify({ error: 'Profile already exists' }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const result = await db.insert(profiles).values({
                userId,
                firstName,
                lastName,
                email,
                dojo: 'HQ', // Default value
                isStudent: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }).returning();

            return new Response(JSON.stringify(result[0]), {
                status: 201, // Created
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Creation failed', details: String(error) }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (request.method === 'PUT') {
        try {
            const payload = await verifyAuth(request);
            const body = await request.json();
            const { userId, ...updates } = body;

            if (!payload || payload.sub !== userId) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!userId) {
                return new Response(JSON.stringify({ error: 'Missing userId' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Sanitize updates to valid columns if needed, for now assuming body matches schema roughly
            // In production, validate with Zod

            const result = await db.update(profiles)
                .set({
                    ...updates,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(profiles.userId, userId))
                .returning();

            return new Response(JSON.stringify(result[0]), {
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
