import { createRemoteJWKSet, jwtVerify } from 'jose';
import { db } from './_db.js';
import { sql } from 'drizzle-orm';

const JWKS_URL = process.env.NEON_AUTH_JWKS_URL;

if (!JWKS_URL) {
    console.warn('NEON_AUTH_JWKS_URL is not defined in environment variables');
}

const JWKS = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

export async function verifyAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('verifyAuth: Missing or invalid Authorization header');
        return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
        console.warn('verifyAuth: Bearer token is valid/empty');
        return null;
    }

    // 1. Try JWT Verification
    if (JWKS) {
        try {
            const { payload } = await jwtVerify(token, JWKS);
            return payload;
        } catch (error) {
            // JWT failed, proceed to opaque token fallback
        }
    }

    // 2. Fallback: Direct Database Check (Neon Auth Tables)
    try {
        const result = await db.execute(sql`
            SELECT 
                u.id as "userId", 
                u.email, 
                u.name, 
                u.image,
                s."expiresAt"
            FROM neon_auth.session s
            JOIN neon_auth.user u ON s."userId" = u.id
            WHERE s.token = ${token}
            LIMIT 1
        `);

        if (!result.rows || result.rows.length === 0) {
            console.warn('verifyAuth: Opaque token not found in neon_auth.session');
            return null;
        }

        const row = result.rows[0];
        // Handle case sensitivity safely
        const expiresAt = new Date(row.expiresAt || row.expiresat);

        if (expiresAt < new Date()) {
            console.warn('verifyAuth: Opaque token expired');
            return null;
        }

        return {
            sub: row.userId || row.userid,
            id: row.userId || row.userid,
            email: row.email,
            name: row.name,
            picture: row.image,
        };

    } catch (dbError) {
        console.error('verifyAuth: Database validation error:', dbError);
        return null;
    }
}
