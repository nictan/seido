import { createRemoteJWKSet, jwtVerify } from 'jose';
import { db } from './_db.js';
import { sql } from 'drizzle-orm';

const JWKS_URL = process.env.NEON_AUTH_JWKS_URL;

if (!JWKS_URL) {
    console.warn('NEON_AUTH_JWKS_URL is not defined in environment variables');
}

const JWKS = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

export async function verifyAuth(request: Request) {
    let token = '';

    // 1. Try Authorization Bearer Header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const extracted = authHeader.split(' ')[1];
        if (extracted && extracted !== 'undefined' && extracted !== 'null') {
            token = extracted;
        }
    }

    // 2. Try Cookie if Bearer is missing or invalid
    if (!token) {
        const cookieHeader = request.headers.get('Cookie');
        if (cookieHeader) {
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            // Try both secure and non-secure cookie names
            token = cookies['__Secure-better-auth.session_token'] || cookies['better-auth.session_token'] || '';
        }
    }

    if (!token) {
        console.warn('verifyAuth: Missing valid token in Header or Cookie');
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
        const expiresAt = new Date((row.expiresAt || row.expiresat) as string | number);

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
