import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema.js';

const databaseUrl = process.env.DATABASE_URL || '';

// Delay throwing to allow the module to load on Vercel Edge so we can debug it
export const db = databaseUrl ? drizzle(neon(databaseUrl), { schema }) : {} as any;

if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in API Environment!!');
}
