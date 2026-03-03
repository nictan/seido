import { db } from './api/_db.js';
import { ranks } from './src/db/schema.js';

async function main() {
    const defaultRank = await db.query.ranks.findFirst({
        where: (ranks, { eq }) => eq(ranks.isDefaultRank, true)
    });
    console.log("Default rank:", defaultRank);

    const whiteBeltRequest = await db.query.ranks.findFirst({
        where: (ranks, { or, ilike }) => or(ilike(ranks.displayName, 'White Belt'), ilike(ranks.displayName, '%White%'))
    });
    console.log("White belt rank:", whiteBeltRequest);

    process.exit(0);
}
main();
