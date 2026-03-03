import { db } from './api/_db.js';
import { sql } from 'drizzle-orm';

async function main() {
    // Check if columns exist
    const result = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('is_admin', 'is_instructor', 'is_student')
        ORDER BY column_name;
    `);
    console.log("Columns found in production profiles table:");
    console.log(result.rows);
    process.exit(0);
}
main();
