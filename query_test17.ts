import { db as devDb } from './api/_db.js';
import { ranks } from './src/db/schema.js';

async function main() {
    // Fetch from dev DB (using .env.local DATABASE_URL)
    const allRanks = await devDb.select().from(ranks).orderBy(ranks.rankOrder);
    console.log(JSON.stringify(allRanks, null, 2));
    process.exit(0);
}
main();
