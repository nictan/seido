import { db } from './api/_db.js';
import { profiles } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        const allProfiles = await db.query.profiles.findMany();
        
        console.log("Total profiles:", allProfiles.length);
        const instructors = allProfiles.filter(p => p.isInstructor);
        console.log("Instructors:", instructors.length);
        console.log(JSON.stringify(instructors, null, 2));

        const admins = allProfiles.filter(p => p.isAdmin);
        console.log("Admins:", admins.length);
        console.log(JSON.stringify(admins, null, 2));
        
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

main();
