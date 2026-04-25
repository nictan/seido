import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories, ranks } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        const students = await db.query.profiles.findMany({
            with: {
                karateProfile: true,
                rankHistories: {
                    where: eq(rankHistories.isCurrent, true),
                    with: {
                        rank: true
                    },
                    limit: 1
                }
            }
        });
        
        console.log("Total profiles:", students.length);
        console.log("Profiles with karateProfile:", students.filter(p => p.karateProfile).length);
        console.log("First 2 profiles:", JSON.stringify(students.slice(0, 2), null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

main();
