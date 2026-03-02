
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../api/admin/users.js';
import { db } from '../api/_db.js';
import { verifyAuth } from '../api/_auth.js';

vi.mock('../api/_db.js', () => ({
    db: {
        execute: vi.fn(),
    },
}));

vi.mock('../api/_auth.js', () => ({
    verifyAuth: vi.fn(),
}));

describe('Admin API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all users if admin', async () => {
        // 1. Mock Auth (Admin)
        (verifyAuth as any).mockResolvedValue({ id: 'admin_id' });

        // 2. Mock Admin Check
        // The handler does `SELECT "is_admin" ...`
        (db.execute as any).mockResolvedValueOnce({ rows: [{ isAdmin: true }] }); // check

        // 3. Mock Fetch Query
        const mockUsers = [
            { userId: 'u1', firstName: 'John', isAdmin: false, isInstructor: false, isStudent: true },
            { userId: 'u2', firstName: 'Sensei', isAdmin: false, isInstructor: true, isStudent: false }
        ];
        (db.execute as any).mockResolvedValueOnce({ rows: mockUsers }); // fetch

        const req = new Request('http://localhost/api/admin/users', { method: 'GET' });
        const res = await handler(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveLength(2);
        expect(data[0].isStudent).toBe(true);
        expect(data[1].isStudent).toBe(false);
    });

    it('should delete user', async () => {
        (verifyAuth as any).mockResolvedValue({ id: 'admin_id' });
        (db.execute as any).mockResolvedValueOnce({ rows: [{ isAdmin: true }] }); // check

        // DELETE queries
        (db.execute as any).mockResolvedValueOnce({}); // delete profile
        (db.execute as any).mockResolvedValueOnce({}); // delete auth

        const req = new Request('http://localhost/api/admin/users', {
            method: 'DELETE',
            body: JSON.stringify({ userId: 'u1', profileId: 'p1' })
        });
        const res = await handler(req);

        expect(res.status).toBe(200);
        expect(db.execute).toHaveBeenCalledTimes(3); // check, delete profile, delete auth
    });
});
