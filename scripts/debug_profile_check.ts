import 'dotenv/config';
import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const email = 'final.verify@seido.sg';
    console.log(`Checking profile for email: ${email}`);

    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.email, email)
    });

    if (profile) {
        console.log('Profile FOUND:');
        console.log(`- ID: ${profile.id}`);
        console.log(`- UserID: ${profile.userId}`);
        console.log(`- Name: ${profile.firstName} ${profile.lastName}`);
    } else {
        console.log('Profile NOT FOUND.');
    }
    process.exit(0);
}

main().catch(console.error);
