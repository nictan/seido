import { db } from './index';
import { profiles } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('Seeding database...');

    const mockUserId = 'user-123';

    // Check if profile exists
    const existing = await db.query.profiles.findFirst({
        where: eq(profiles.userId, mockUserId),
    });

    if (existing) {
        console.log('Mock profile already exists.');
        return;
    }

    // Insert mock profile
    await db.insert(profiles).values({
        userId: mockUserId,
        firstName: 'Nicholas',
        lastName: 'Student',
        email: 'student@seido.sg',
        mobile: '91234567',
        dateOfBirth: '1995-05-15',
        gender: 'Male',
        dojo: 'HQ',
        isStudent: true,
        remarks: 'Enthusiastic seed user',
        currentGrade: {
            kyu: 10,
            dan: null,
            belt_color: 'White',
            effective_date: '2024-01-01'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    console.log('Database seeded successfully!');
}

main().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
