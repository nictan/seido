import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
async function main() {
    const db = drizzle(neon(process.env.DEV_DB_URL!));
    const r = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`);
    console.log(r.rows.map((x: any) => x.table_name).join('\n'));
    process.exit(0);
}
main();
