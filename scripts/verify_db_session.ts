import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Verifying access to neon_auth.user...');

    try {
        const result = await db.execute(sql`SELECT * FROM neon_auth.user LIMIT 1`);
        console.log('Query user successful.');
        const row = result.rows ? result.rows[0] : null;
        console.log('First User Row:', row);

        if (row) {
            console.log('User Keys:', Object.keys(row));
        }
    } catch (e: any) {
        console.error('Query failed:', e.message);
    }
    process.exit(0);
}

main().catch(console.error);
