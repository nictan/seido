import { db } from './api/_db.js';
import { sql } from 'drizzle-orm';

async function main() {
    // Try a direct INSERT to see exact error
    try {
        await db.execute(sql`
            INSERT INTO profiles (id, user_id, first_name, last_name, email, mobile, is_admin, is_instructor, is_student, created_at, updated_at)
            VALUES (gen_random_uuid(), 'test-user', 'Test', 'User', 'canary_test_delete_me@test.com', '90000000', false, false, true, now(), now())
            ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id
        `);
        console.log("INSERT SUCCEEDED - columns work!");
    } catch (err: any) {
        console.error("INSERT FAILED:", err.message);
    }
    
    // Clean up
    try {
        await db.execute(sql`DELETE FROM profiles WHERE email = 'canary_test_delete_me@test.com'`);
        console.log("Cleanup done");
    } catch (e) {}
    
    process.exit(0);
}
main();
