// Run via: npm run tsx query_test.ts
import { db } from './api/_db.js';
import { profiles } from './src/db/schema.js';

async function main() {
    const profile = await db.query.profiles.findFirst();
    console.log(JSON.stringify(profile, null, 2));
    process.exit(0);
}
main();
