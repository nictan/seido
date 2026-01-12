import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Checking for session tables in database...');

    try {
        const result = await db.execute(sql`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%session%' 
               OR table_name LIKE '%user%' 
               OR table_name LIKE '%auth%'
        `);
        console.log('Tables found:', result.rows || result);
    } catch (e: any) {
        console.error('Query failed:', e.message);
    }
    process.exit(0);
}

main().catch(console.error);
