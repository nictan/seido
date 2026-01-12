import { db } from '../src/db/index.js';
import { ranks } from '../src/db/schema.js';
import { asc } from 'drizzle-orm';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
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

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
