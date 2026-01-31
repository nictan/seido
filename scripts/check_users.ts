
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema.js';
import * as dotenv from 'dotenv';
import { eq, or } from 'drizzle-orm';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set in environment variables.');
    process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function checkUsers() {
    try {
        const users = await db.query.profiles.findMany({
            where: or(
                eq(schema.profiles.email, 'instructor_exam@test.com'),
                eq(schema.profiles.email, 'student_exam@test.com')
            )
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}

checkUsers();
