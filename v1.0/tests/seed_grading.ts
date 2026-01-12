import { db } from '../src/db/index.js';
import { gradingPeriods } from '../src/db/schema.js';

async function main() {
    console.log('Seeding grading period...');
    try {
        const dummyAdminId = '00000000-0000-0000-0000-000000000000'; // Placeholder
        const result = await db.insert(gradingPeriods).values({
            title: 'Spring Grading 2026',
            description: 'Quarterly grading for all belts.',
            gradingDate: new Date('2026-03-15').toISOString(),
            location: 'Main Dojo',
            status: 'Upcoming',
            createdBy: dummyAdminId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();
        console.log('Seeded Grading Period:', result[0].id);
    } catch (e) {
        console.error('Seeding failed:', e);
    }
    process.exit(0);
}
main();
