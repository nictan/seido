
import { db } from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';


export default async function handler(request: Request) {
    if (request.method === 'POST') {
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

            const body = await request.json();
            const { targetUserId, newPassword } = body;

            if (!targetUserId || !newPassword) {
                return new Response(JSON.stringify({ error: 'Missing targetUserId or newPassword' }), { status: 400 });
            }

            if (newPassword.length < 8) {
                return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400 });
            }

            // Hash the new password
            const hashedPassword = await hashPassword(newPassword);

            // First check if account exists
            const accountCheck = await db.execute(sql`
                SELECT id FROM neon_auth.account WHERE "userId" = ${targetUserId}
            `);

            if (accountCheck.rows.length === 0) {
                return new Response(JSON.stringify({ error: 'User does not have a linked auth account (perhaps social login only?)' }), { status: 404 });
            }

            // Update password
            await db.execute(sql`
                UPDATE neon_auth.account 
                SET password = ${hashedPassword}, "updatedAt" = NOW()
                WHERE "userId" = ${targetUserId}
            `);

            return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), { status: 200 });

        } catch (error: any) {
            console.error('Password reset error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
