import { db } from '../src/db/index.js';
import { ranks } from '../src/db/schema.js';
import { asc, eq, sql } from 'drizzle-orm';
import { verifyAuth } from './_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    // 1. GET - Public Access
    if (request.method === 'GET') {
        try {
            const allRanks = await db.select().from(ranks).orderBy(asc(ranks.rankOrder));

            return new Response(JSON.stringify(allRanks), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error: any) {
            console.error('API: Ranks GET - Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // AUTHENTICATION CHECK FOR MUTATION METHODS
    try {
        const user = await verifyAuth(request);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Verify Admin Status
        const adminCheck = await db.execute(sql`
             SELECT "is_admin" as "isAdmin" FROM profiles WHERE user_id = ${user.id}
         `);

        if (!adminCheck.rows.length || !adminCheck.rows[0].isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }

        // 2. POST - Create Rank
        if (request.method === 'POST') {
            const body = await request.json();
            const { displayName, rankOrder, kyu, dan, beltColor, stripes, isDefaultRank } = body;

            if (!displayName || !rankOrder || !beltColor) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
            }

            // Insert
            await db.insert(ranks).values({
                displayName,
                rankOrder: parseInt(rankOrder),
                kyu: kyu ? parseInt(kyu) : null,
                dan: dan ? parseInt(dan) : null,
                beltColor,
                stripes: stripes ? parseInt(stripes) : 0,
                isDefaultRank: isDefaultRank || false
            });

            return new Response(JSON.stringify({ success: true }), { status: 201 });
        }

        // 3. PUT - Update Rank
        if (request.method === 'PUT') {
            const body = await request.json();
            const { id, displayName, rankOrder, kyu, dan, beltColor, stripes, isDefaultRank } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing Rank ID' }), { status: 400 });
            }

            await db.update(ranks)
                .set({
                    displayName,
                    rankOrder: parseInt(rankOrder),
                    kyu: kyu ? parseInt(kyu) : null,
                    dan: dan ? parseInt(dan) : null,
                    beltColor,
                    stripes: stripes ? parseInt(stripes) : 0,
                    isDefaultRank: isDefaultRank || false,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(ranks.id, id));

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        // 4. DELETE - Delete Rank
        if (request.method === 'DELETE') {
            const body = await request.json();
            const { id } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing Rank ID' }), { status: 400 });
            }

            await db.delete(ranks).where(eq(ranks.id, id));

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

    } catch (error: any) {
        console.error('API: Ranks Mutation - Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
