
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../api/profile.js';
import { db } from '../api/_db.js';
import { verifyAuth } from '../api/_auth.js';

// Mock schema to avoid import errors if DB not connected
vi.mock('../src/db/schema.js', () => ({
    profiles: { userId: 'userId' }, // minimal mock
    karateProfiles: {},
    rankHistories: {},
    ranks: { displayName: 'displayName' }
}));

// Mock dependencies
vi.mock('../api/_db.js', () => ({
    db: {
        insert: vi.fn(),
        query: {
            profiles: {
                findFirst: vi.fn()
            },
            ranks: {
                findFirst: vi.fn()
            }
        },
        update: vi.fn(),
    },
}));

vi.mock('../api/_auth.js', () => ({
    verifyAuth: vi.fn(),
}));

describe('Profile API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a profile and sanitize empty dateOfBirth', async () => {
        // 1. Mock Auth
        const mockUserId = 'user_123';
        (verifyAuth as any).mockResolvedValue({ sub: mockUserId });
        (db.query.ranks.findFirst as any).mockResolvedValue({ id: 'white_belt_id' });

        // 2. Mock DB calls
        const mockProfile = { id: 'profile_123', userId: mockUserId };
        const valuesSpy = vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockProfile])
        });
        (db.insert as any).mockReturnValue({ values: valuesSpy });

        // 3. Create Request
        const body = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            dateOfBirth: "", // Empty string to test sanitization
            gender: "",      // Empty string to test sanitization
            mobile: '12345678',
            dojo: 'HQ'
        };

        const req = new Request('http://localhost/api/profile', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // 4. Run Handler
        await handler(req);

        // 5. Verify arguments passed to values()
        // The handler calls db.insert(profiles).values(...) first
        const profileInsertArgs = valuesSpy.mock.calls[0][0];

        expect(profileInsertArgs.dateOfBirth).toBeNull(); // Should be sanitized
        expect(profileInsertArgs.gender).toBe("Other");   // Should be sanitized/defaulted
    });
});
