import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function getColumns(dbUrl: string, label: string) {
    const db = drizzle(neon(dbUrl));
    const r = await db.execute(sql`
        SELECT table_name, column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    `);
    return { label, columns: r.rows as any[] };
}

async function main() {
    const devUrl = process.env.DEV_DB_URL!;
    const prodUrl = process.env.PROD_DB_URL!;

    const [dev, prod] = await Promise.all([
        getColumns(devUrl, 'DEV'),
        getColumns(prodUrl, 'PROD'),
    ]);

    // Find tables/columns in dev that are missing from prod
    const prodSet = new Set(prod.columns.map(c => `${c.table_name}.${c.column_name}`));
    const devSet = new Set(dev.columns.map(c => `${c.table_name}.${c.column_name}`));

    const missingInProd = dev.columns.filter(c => !prodSet.has(`${c.table_name}.${c.column_name}`));
    const missingInDev = prod.columns.filter(c => !devSet.has(`${c.table_name}.${c.column_name}`));

    console.log('\n=== In DEV but MISSING in PROD ===');
    if (missingInProd.length === 0) console.log('None — prod is up to date!');
    else missingInProd.forEach(c => console.log(`  ${c.table_name}.${c.column_name} (${c.data_type})`));

    console.log('\n=== In PROD but MISSING in DEV ===');
    if (missingInDev.length === 0) console.log('None');
    else missingInDev.forEach(c => console.log(`  ${c.table_name}.${c.column_name} (${c.data_type})`));

    process.exit(0);
}
main();
