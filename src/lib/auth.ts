import { createAuthClient } from '@neondatabase/auth';

// Your Neon Auth Base URL from the Neon Console
const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!neonAuthUrl) {
    throw new Error('Missing VITE_NEON_AUTH_URL environment variable');
}

export const authClient = createAuthClient(neonAuthUrl);
