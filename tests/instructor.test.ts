
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mocks internally to avoid hoisting issues
vi.mock('../src/db/index.js', () => ({
    db: {
        query: {
            profiles: {
                findFirst: vi.fn(),
                findMany: vi.fn()
            },
            karateProfiles: {
                findMany: vi.fn()
            },
            ranks: {
                findFirst: vi.fn()
            }
        },
        insert: vi.fn(),
        update: vi.fn(),
        execute: vi.fn(),
    }
}));

vi.mock('../api/_db.js', () => ({
    db: {
        query: {
            profiles: {
                findFirst: vi.fn(),
                findMany: vi.fn()
            },
            karateProfiles: {
                findMany: vi.fn()
            },
            ranks: {
                findFirst: vi.fn()
            }
        },
        insert: vi.fn(),
        update: vi.fn(),
        execute: vi.fn(),
    }
}));

vi.mock('../api/_auth.js', () => ({
    verifyAuth: vi.fn(),
}));

import { db } from '../src/db/index.js'; // Import mocked DB
import handler from '../api/instructor/students.js';
import { verifyAuth } from '../api/_auth.js';

describe('Instructor API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should deny non-instructors', async () => {
        (verifyAuth as any).mockResolvedValue({ sub: 'user_1' });
        // Mock profile check
        (db.query.profiles.findFirst as any).mockResolvedValue({ isInstructor: false, isAdmin: false });

        const req = new Request('http://localhost/api/instructor/students', { method: 'GET' });
        const res = await handler(req);

        expect(res.status).toBe(403);
    });

    it('should fetch students if instructor', async () => {
        (verifyAuth as any).mockResolvedValue({ sub: 'inst_1' });
        (db.query.profiles.findFirst as any).mockResolvedValue({ isInstructor: true });

        // Mock student fetch
        (db.query.profiles.findMany as any).mockResolvedValue([
            {
                id: 'p1', userId: 'u1', firstName: 'S1', lastName: 'Name', email: 's1@e.com', mobile: '111',
                karateProfile: { dojo: 'HQ' },
                rankHistories: [{ rank: { displayName: 'White', beltColor: 'white' } }]
            }
        ]);

        const req = new Request('http://localhost/api/instructor/students', { method: 'GET' });
        const res = await handler(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveLength(1);
        expect(data[0].currentRank).toBe('White');
    });

    it('should update student details', async () => {
        (verifyAuth as any).mockResolvedValue({ sub: 'inst_1' });

        // Mock implementations
        (db.query.profiles.findFirst as any)
            .mockResolvedValueOnce({ isInstructor: true }) // Requester
            .mockResolvedValueOnce({ id: 's1', email: 'old@e.com' }) // Target Student
            .mockResolvedValueOnce(null) // Email uniqueness check (none found)
            .mockResolvedValueOnce({ id: 'rank_id' }); // Rank lookup

        // Mock Transaction mocks implicitly by update/insert returning something
        (db.update as any).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            })
        });
        (db.insert as any).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue({})
            })
        });

        const req = new Request('http://localhost/api/instructor/students', {
            method: 'PUT',
            body: JSON.stringify({
                studentId: 's1',
                mobile: '999',
                dojo: 'TP',
                rank: 'Yellow'
            })
        });

        const res = await handler(req);
        expect(res.status).toBe(200);
        expect(db.update).toHaveBeenCalled();
    });
});
