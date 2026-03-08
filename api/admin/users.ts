
import { db } from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { sql } from 'drizzle-orm';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method === 'GET') {
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

            const users = await db.execute(sql`
                SELECT 
                    p.id as "profileId",
                    p.user_id as "userId",
                    p.first_name as "firstName",
                    p.last_name as "lastName",
                    p.email,
                    p.is_admin as "isAdmin",
                    p.is_instructor as "isInstructor",
                    p.is_student as "isStudent",
                    p.waiver_accepted_at as "waiverAcceptedAt",
                    kp.dojo,
                    COALESCE(
                        json_object_agg(uf.feature, uf.enabled) FILTER (WHERE uf.feature IS NOT NULL),
                        '{}'
                    ) as features
                FROM profiles p
                LEFT JOIN karate_profiles kp ON kp.profile_id = p.id
                LEFT JOIN user_features uf ON uf.profile_id = p.id
                GROUP BY p.id, kp.dojo
                ORDER BY p.first_name ASC
            `);

            return new Response(JSON.stringify(users.rows), { status: 200 });

        } catch (error: any) {
            console.error('Admin users fetch error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
        }
    }

    if (request.method === 'PUT') {
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
            const { profileId, isAdmin, isInstructor, isStudent, dojo, features } = body;

            if (!profileId) {
                return new Response(JSON.stringify({ error: 'Missing profileId' }), { status: 400 });
            }

            // 1. Update profiles table (isAdmin, isInstructor, isStudent)
            const profileUpdates = [];
            if (isAdmin !== undefined) profileUpdates.push(sql`is_admin = ${isAdmin}`);
            if (isInstructor !== undefined) profileUpdates.push(sql`is_instructor = ${isInstructor}`);
            if (isStudent !== undefined) profileUpdates.push(sql`is_student = ${isStudent}`);

            if (profileUpdates.length > 0) {
                profileUpdates.push(sql`updated_at = NOW()`);
                await db.execute(sql`
                    UPDATE profiles 
                    SET ${sql.join(profileUpdates, sql`, `)}
                    WHERE id = ${profileId}
                `);
            }

            // 2. Update karate_profiles (dojo)
            if (dojo !== undefined) {
                await db.execute(sql`
                    UPDATE karate_profiles
                    SET dojo = ${dojo}, updated_at = NOW()
                    WHERE profile_id = ${profileId}
                `);
            }

            // 3. Upsert user_features
            if (features && typeof features === 'object') {
                for (const [feature, enabled] of Object.entries(features)) {
                    await db.execute(sql`
                        INSERT INTO user_features (profile_id, feature, enabled, updated_at)
                        VALUES (${profileId}, ${feature}, ${!!enabled}, NOW())
                        ON CONFLICT (profile_id, feature)
                        DO UPDATE SET enabled = ${!!enabled}, updated_at = NOW()
                    `);
                }
            }

            return new Response(JSON.stringify({ success: true, message: 'User updated successfully' }), { status: 200 });

        } catch (error: any) {
            console.error('Admin user update error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
        }
    }

    if (request.method === 'DELETE') {
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
            const { userId, profileId } = body;

            if (!userId || !profileId) {
                return new Response(JSON.stringify({ error: 'Missing userId or profileId' }), { status: 400 });
            }

            // Prevent self-deletion
            if (userId === user.id) {
                return new Response(JSON.stringify({ error: 'Cannot delete your own admin account' }), { status: 400 });
            }

            // 1. Delete from profiles (Cascades to app data like grading_applications, karate_profiles)
            await db.execute(sql`DELETE FROM profiles WHERE id = ${profileId}`);

            // 2. Delete from auth tables (neon_auth.user, neon_auth.account, neon_auth.session)
            // We need to delete from neon_auth.users usually, cascading to accounts/sessions
            await db.execute(sql`DELETE FROM neon_auth.users WHERE id = ${userId}`);

            return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), { status: 200 });

        } catch (error: any) {
            console.error('Admin user delete error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
