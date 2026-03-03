import { db } from './api/_db.js';
import { sql } from 'drizzle-orm';

async function main() {
    // Report which DATABASE_URL we are using
    const url = process.env.DATABASE_URL || 'NOT SET';
    const sanitized = url.replace(/:([^@]+)@/, ':***@'); // mask password
    console.log("DATABASE_URL:", sanitized);
    
    // Get the current_database and current schema  
    const dbInfo = await db.execute(sql`SELECT current_database(), current_schema(), pg_postmaster_start_time();`);
    console.log("DB Info:", dbInfo.rows[0]);

    process.exit(0);
}
main();
