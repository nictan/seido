import { db } from './api/_db.js';
import { sql } from 'drizzle-orm';
import { ranks } from './src/db/schema.js';

async function main() {
    // Check existing ranks in production DB
    const existingRanks = await db.select().from(ranks);
    console.log("Existing ranks in production:", existingRanks.length, existingRanks.map(r => r.displayName));
    
    process.exit(0);
}
main();
