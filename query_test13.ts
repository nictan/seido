import { db } from './api/_db.js';
import { sql } from 'drizzle-orm';

async function main() {
    // Check what schemas exist and which tables are in which schema
    const result = await db.execute(sql`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'profiles'
        ORDER BY table_schema;
    `);
    console.log("Tables named 'profiles' found:");
    console.log(result.rows);

    // Also check search_path
    const pathResult = await db.execute(sql`SHOW search_path;`);
    console.log("Current search_path:", pathResult.rows);

    // Check all columns for ALL profiles tables
    const colResult = await db.execute(sql`
        SELECT table_schema, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles'
        ORDER BY table_schema, ordinal_position;
    `);
    console.log("All columns in 'profiles' tables:");
    console.log(colResult.rows);

    process.exit(0);
}
main();
