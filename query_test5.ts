// query_test5.ts
import { db } from './api/_db.js';
import { profiles, karateProfiles, rankHistories, ranks } from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function main() {
    const userId = '9435c688-9e38-4cfd-98e5-ca65b09ad3b5';

    const result = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
        with: {
            karateProfile: true,
            rankHistories: {
                with: { rank: true },
                orderBy: [desc(rankHistories.effectiveDate)],
                limit: 10
            }
        }
    });

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}
main();
