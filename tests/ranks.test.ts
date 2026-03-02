import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../api/ranks.js';
import { db } from '../src/db/index.js';
import { verifyAuth } from '../api/_auth.js';

// Define mocks internally
vi.mock('../src/db/index.js', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnValue({ values: vi.fn() }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
        delete: vi.fn().mockReturnValue({ where: vi.fn() }),
        execute: vi.fn(),
    }
}));

vi.mock('../api/_auth.js', () => ({
    verifyAuth: vi.fn(),
}));

// Mock schema to prevent reference errors
vi.mock('../src/db/schema.js', () => ({
    ranks: {
        id: 'id',
        rankOrder: 'rankOrder',
    }
}));

describe('Ranks API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return all ranks on GET request', async () => {
        const mockRanks = [
            { id: '1', displayName: 'White Belt', rankOrder: 1 }
        ];

        // Mock the resolved value from the chained query db.select().from(...).orderBy(...)
        (db.orderBy as any).mockResolvedValueOnce(mockRanks);

        const req = new Request('http://localhost/api/ranks', { method: 'GET' });
        const res = await handler(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveLength(1);
        expect(data[0].displayName).toBe('White Belt');
    });

    it('should deny POST request if unauthorized', async () => {
        (verifyAuth as any).mockResolvedValueOnce(null);

        const req = new Request('http://localhost/api/ranks', {
            method: 'POST',
            body: JSON.stringify({ displayName: 'Yellow Belt', rankOrder: 2, beltColor: 'yellow' })
        });
        const res = await handler(req);

        expect(res.status).toBe(401);
    });

    it('should deny POST request if not an admin', async () => {
        (verifyAuth as any).mockResolvedValueOnce({ id: 'user_1' });
        (db.execute as any).mockResolvedValueOnce({ rows: [{ isAdmin: false }] });

        const req = new Request('http://localhost/api/ranks', {
            method: 'POST',
            body: JSON.stringify({ displayName: 'Yellow Belt', rankOrder: 2, beltColor: 'yellow' })
        });
        const res = await handler(req);

        expect(res.status).toBe(403);
    });

    it('should allow POST request for admin to create rank', async () => {
        (verifyAuth as any).mockResolvedValueOnce({ id: 'admin_1' });
        (db.execute as any).mockResolvedValueOnce({ rows: [{ isAdmin: true }] });

        const req = new Request('http://localhost/api/ranks', {
            method: 'POST',
            body: JSON.stringify({ displayName: 'Yellow Belt', rankOrder: 2, beltColor: 'yellow' })
        });
        const res = await handler(req);

        expect(res.status).toBe(201);
    });
});
