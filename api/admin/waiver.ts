import { db } from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { sql } from 'drizzle-orm';

export const config = { runtime: 'edge' };

const WAIVER_KEYS = ['waiver_text', 'waiver_version'] as const;

export default async function handler(request: Request) {
    // Public GET — WaiverPage fetches this without auth
    if (request.method === 'GET') {
        const rows = await db.execute(sql`
            SELECT key, value FROM site_config WHERE key IN ('waiver_text', 'waiver_version')
        `);
        const result: Record<string, string> = {};
        rows.rows.forEach((r: any) => { result[r.key] = r.value; });
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // All mutations require admin auth
    const payload = await verifyAuth(request);
    if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const adminCheck = await db.execute(sql`
        SELECT is_admin FROM profiles WHERE user_id = ${payload.sub as string}
    `);
    if (!adminCheck.rows.length || !adminCheck.rows[0].is_admin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    if (request.method === 'PUT') {
        const body = await request.json() as { waiver_text?: string; waiver_version?: string };

        for (const key of WAIVER_KEYS) {
            if (body[key] !== undefined) {
                await db.execute(sql`
                    INSERT INTO site_config (key, value, updated_at)
                    VALUES (${key}, ${body[key]!}, NOW())
                    ON CONFLICT (key)
                    DO UPDATE SET value = ${body[key]!}, updated_at = NOW()
                `);
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
