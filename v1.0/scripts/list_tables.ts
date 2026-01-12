import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function listTables() {
    try {
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `;
        console.log('Tables in database:', result.map(r => r.table_name));
    } catch (e) {
        console.error('Error listing tables:', e);
    }
}

listTables();
