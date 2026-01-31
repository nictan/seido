
import { db } from '../src/db/index.js';
import { ranks } from '../src/db/schema.js';
import { eq, or, ilike } from 'drizzle-orm';

async function checkRanks() {
    console.log("Checking Ranks in DB...");

    // 1. Check all ranks
    const allRanks = await db.select().from(ranks);
    console.log(`Total Ranks found: ${allRanks.length}`);
    allRanks.forEach(r => console.log(`- ${r.displayName} (ID: ${r.id}, Order: ${r.rankOrder})`));

    // 2. Check for White Belt specifically (logic from api/profile.ts)
    const whiteBelt = await db.query.ranks.findFirst({
        where: (ranks, { eq, or, ilike }) => or(eq(ranks.displayName, 'White Belt'), ilike(ranks.displayName, '%White%'))
    });

    if (whiteBelt) {
        console.log(`\n[SUCCESS] Found White Belt logic match: ${whiteBelt.displayName} (${whiteBelt.id})`);
    } else {
        console.log(`\n[FAILURE] White Belt logic returned nothing.`);
    }

    // 3. Check hardcoded ID
    const hardcodedId = "f255b2d1-2fde-454d-b1ac-10456ffe0385";
    const fallback = await db.query.ranks.findFirst({
        where: eq(ranks.id, hardcodedId)
    });

    if (fallback) {
        console.log(`\n[SUCCESS] Fallback Hardcoded ID exists: ${fallback.displayName}`);
    } else {
        console.log(`\n[WARNING] Fallback Hardcoded ID ${hardcodedId} DOES NOT EXIST in DB.`);
    }

    process.exit(0);
}

checkRanks().catch((err) => {
    console.error(err);
    process.exit(1);
});
