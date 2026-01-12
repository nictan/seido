import 'dotenv/config';
// We need to point to the actual file. 
// Since TSX runs TS directly, pointing to ../api/_auth.ts works if we omit .js or use .ts?
// In ESM we might need .js or full path.
// Let's try importing from the relative path.

import { verifyAuth } from '../api/_auth.js';

async function main() {
    console.log('Import successful.');
    console.log('NEON_AUTH_JWKS_URL:', process.env.NEON_AUTH_JWKS_URL);

    // Attempt verification with fake request
    const req = new Request('http://localhost', {
        headers: { 'Authorization': 'Bearer test' }
    });

    try {
        await verifyAuth(req);
    } catch (e: any) {
        console.log('Caught expected error:', e.message);
    }
}

main().catch(console.error);
