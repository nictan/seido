import { db } from './api/_db.js';
import { sql } from 'drizzle-orm';
async function main() {
    const r = await db.execute(sql`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_name IN ('profiles', 'karate_profiles')
        AND column_name IN ('is_student', 'is_instructor', 'is_admin')
        ORDER BY table_name, column_name
    `);
    console.log("Columns found:", JSON.stringify(r.rows, null, 2));
    process.exit(0);
}
main();
