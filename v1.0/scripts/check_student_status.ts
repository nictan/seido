
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema.js';
import * as dotenv from 'dotenv';
import { eq, desc } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function checkStudentStatus(email: string) {
    console.log(`Checking status for: ${email}`);

    const profile = await db.query.profiles.findFirst({
        where: eq(schema.profiles.email, email),
        with: {
            karateProfile: true,
            gradingApplications: {
                with: {
                    gradingPeriod: true
                }
            }
        }
    });

    if (!profile) {
        console.log('User not found.');
        return;
    }

    console.log(`User: ${profile.firstName} ${profile.lastName} (ID: ${profile.id})`);

    // Check Rank History using db.query API without orderBy to be safe
    const history = await db.query.rankHistories.findMany({
        where: eq(schema.rankHistories.profileId, profile.id),
        limit: 5
    });

    // Sort manually in JS
    history.sort((a, b) => new Date(b.promotedDate).getTime() - new Date(a.promotedDate).getTime());

    console.log('Rank History (Top 3):');
    history.slice(0, 3).forEach(h => {
        console.log(`- Rank: ${h.rankId}, Promoted: ${h.promotedDate}, IsCurrent: ${h.isCurrent}`);
    });

    console.log('Applications:');
    if (profile.gradingApplications) {
        profile.gradingApplications.forEach(app => {
            console.log(`- Period: ${app.gradingPeriod?.title}, Status: ${app.status}, Proposed: ${app.proposedRankId}`);
        });
    }
}

checkStudentStatus('student_1337@seido.sg');
