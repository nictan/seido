import { db } from './_db.js';
import { profiles } from '../src/db/schema.js';
import { sql } from 'drizzle-orm';

export const config = {
    runtime: 'edge', // Test if running in Edge fixes the crash
};

export default async function handler(request: Request) {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(profiles);
        return new Response(JSON.stringify({ success: true, count: result[0].count }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
