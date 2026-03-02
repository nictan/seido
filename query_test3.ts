import { db } from './api/_db.js';
import { profiles } from './src/db/schema.js';

async function main() {
    const allProfiles = await db.query.profiles.findMany();
    console.log("All Profiles:");
    allProfiles.forEach(p => console.log(`- ${p.email} (userId: ${p.userId}, name: ${p.firstName})`));

    console.log("\nAll Neon Auth Users:");
    const { sql } = await import('drizzle-orm');
    const authUsers = await db.execute(sql`SELECT id, email FROM neon_auth.user`);
    authUsers.rows.forEach((u: any) => console.log(`- ${u.email} (id: ${u.id})`));

    process.exit(0);
}
main();
