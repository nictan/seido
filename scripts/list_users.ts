import 'dotenv/config';
import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema.js';

async function listUsers() {
    console.log("Listing all users...");
    try {
        const allProfiles = await db.select().from(profiles);
        console.log(`Found ${allProfiles.length} profiles:`);
        allProfiles.forEach(p => console.log(`- ${p.email} (${p.firstName} ${p.lastName})`));
    } catch (error) {
        console.error("Error listing users:", error);
    }
    process.exit(0);
}

listUsers();
