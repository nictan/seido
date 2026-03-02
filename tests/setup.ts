import { vi } from 'vitest';

// Mock environment variables required by API route files
process.env.DATABASE_URL = 'postgres://mock:mock@mock.neon.tech/mock';
process.env.NEON_AUTH_JWKS_URL = 'https://mock.neon.tech/jwks';

// Mock the Neon serverless database connection completely to prevent network hanging
vi.mock('@neondatabase/serverless', () => ({
    neon: vi.fn(),
}));

vi.mock('drizzle-orm/neon-http', () => ({
    drizzle: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnValue({ values: vi.fn() }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
        delete: vi.fn().mockReturnValue({ where: vi.fn() }),
        execute: vi.fn().mockResolvedValue({ rows: [] }),
        query: {
            profiles: { findFirst: vi.fn(), findMany: vi.fn() },
            ranks: { findFirst: vi.fn(), findMany: vi.fn() },
            karateProfiles: { findFirst: vi.fn(), findMany: vi.fn() }
        }
    }),
}));

// Mock jose JWT
vi.mock('jose', () => ({
    createRemoteJWKSet: vi.fn(),
    jwtVerify: vi.fn(),
}));
