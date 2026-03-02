
import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema.js';
import { desc } from 'drizzle-orm';

async function checkProfiles() {
    console.log("Checking Profiles in DB...");

    const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));

    console.log(`Total Profiles: ${allProfiles.length}`);
    allProfiles.forEach(p => {
        console.log(`- ${p.firstName} ${p.lastName} (${p.email}) [ID: ${p.userId}] Created: ${p.createdAt}`);
    });

    process.exit(0);
}

checkProfiles().catch((err) => {
    console.error(err);
    process.exit(1);
});
