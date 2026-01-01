import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL = process.env.NEON_AUTH_JWKS_URL;

if (!JWKS_URL) {
    console.warn('NEON_AUTH_JWKS_URL is not defined in environment variables');
}

const JWKS = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

export async function verifyAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token || !JWKS) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        return payload; // Returns the decoded user information
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}
