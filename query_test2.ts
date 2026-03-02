import { db } from './api/_db.js';
import { profiles } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const email = 'nicorasu.tan@gmail.com';
    const profileByEmail = await db.query.profiles.findFirst({
        where: eq(profiles.email, email)
    });
    console.log("Profile by email:", JSON.stringify(profileByEmail, null, 2));

    // Also query neon auth user
    const { sql } = require('drizzle-orm');
    const authUser = await db.execute(sql`SELECT id, email, name FROM neon_auth.user WHERE email = ${email} LIMIT 1`);
    console.log("Auth User:", JSON.stringify(authUser.rows, null, 2));

    process.exit(0);
}
main();
