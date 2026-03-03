import { db } from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { sql } from 'drizzle-orm';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
    const payload = await verifyAuth(request);
    if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // Check admin
    const adminCheck = await db.execute(sql`
        SELECT is_admin FROM profiles WHERE user_id = ${payload.sub as string}
    `);
    if (!adminCheck.rows.length || !adminCheck.rows[0].is_admin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    if (request.method === 'GET') {
        const rows = await db.execute(sql`SELECT key, value FROM site_config`);
        const result: Record<string, boolean> = {};
        rows.rows.forEach((r: any) => { result[r.key] = r.value === 'true'; });
        return new Response(JSON.stringify(result), { status: 200 });
    }

    if (request.method === 'PUT') {
        const body = await request.json() as Record<string, boolean>;
        for (const [key, value] of Object.entries(body)) {
            await db.execute(sql`
                INSERT INTO site_config (key, value, updated_at)
                VALUES (${key}, ${value ? 'true' : 'false'}, NOW())
                ON CONFLICT (key)
                DO UPDATE SET value = ${value ? 'true' : 'false'}, updated_at = NOW()
            `);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
