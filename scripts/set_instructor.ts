
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema.js';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set in environment variables.');
    process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function setInstructor(email: string) {
    if (!email) {
        console.error('Usage: npx tsx scripts/set_instructor.ts <email>');
        process.exit(1);
    }

    console.log(`Looking for user with email: ${email}...`);

    try {
        // 1. Find profile by email
        const profile = await db.query.profiles.findFirst({
            where: eq(schema.profiles.email, email),
            with: {
                karateProfile: true
            }
        });

        if (!profile) {
            console.error(`Error: User with email '${email}' not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${profile.firstName} ${profile.lastName} (ID: ${profile.id})`);

        if (profile.karateProfile?.isInstructor) {
            console.log('User is already an instructor.');
            process.exit(0);
        }

        // 2. Update karate_profile
        console.log('Promoting to instructor...');
        await db.update(schema.karateProfiles)
            .set({
                isInstructor: true,
                updatedAt: new Date().toISOString()
            })
            .where(eq(schema.karateProfiles.profileId, profile.id));

        console.log('Success! User has been granted instructor access.');
        console.log('They should now be able to access the Instructor Dashboard.');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

// Get email from command line args
const emailArg = process.argv[2];
setInstructor(emailArg);
