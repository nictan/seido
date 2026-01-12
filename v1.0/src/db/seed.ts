import { db } from './index';
import { profiles, karateProfiles } from './schema';
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
    const [newProfile] = await db.insert(profiles).values({
        userId: mockUserId,
        firstName: 'Nicholas',
        lastName: 'Student',
        email: 'student@seido.sg',
        mobile: '91234567',
        dateOfBirth: '1995-05-15',
        gender: 'Male',
        emergencyContactName: 'Test Contact',
        emergencyContactRelationship: 'Parent',
        emergencyContactPhone: '99999999',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }).returning();

    // Insert karate profile
    await db.insert(karateProfiles).values({
        profileId: newProfile.id,
        dojo: 'HQ',
        isStudent: true,
        isInstructor: false,
    });

    console.log('Database seeded successfully!');
}

main().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
