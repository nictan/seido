import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
import { verifyAuth } from '../_auth';

export const config = {
    runtime: 'edge',
};

// Initialize Drizzle ORM
function getDb() {
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle(sql, { schema });
}

export default async function handler(request: Request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const url = new URL(request.url);
        const method = request.method;
        const db = getDb();

        // **Public GET**: Fetch all rule documents
        // Ordered by displayOrder
        if (method === 'GET') {
            const documents = await db.query.refereeRuleDocuments.findMany({
                orderBy: (docs, { asc }) => [asc(docs.displayOrder), asc(docs.createdAt)],
            });

            return new Response(JSON.stringify(documents), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // --------------------------------------------------------------------------------
        // **ALL methods below require ADMIN authentication**
        // --------------------------------------------------------------------------------
        let isAdmin = false;
        try {
            const payload = await verifyAuth(request);
            if (payload?.sub) {
                const profileResult = await db.execute(sql`SELECT is_admin FROM profiles WHERE user_id = ${payload.sub}`);
                isAdmin = (profileResult.rows[0] as any)?.is_admin || false;
            }
        } catch (error) {
            console.error('Auth verification error:', error);
        }

        if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // **POST**: Create a new rule document
        if (method === 'POST') {
            const body = await request.json();
            const { title, category, description, fileUrl, version, effectiveDate, displayOrder } = body;

            if (!title || !category) {
                return new Response(JSON.stringify({ error: 'Title and category are required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const [newDoc] = await db.insert(schema.refereeRuleDocuments).values({
                title,
                category,
                description,
                fileUrl,
                version,
                effectiveDate: effectiveDate || null,
                displayOrder: displayOrder ?? 0,
            }).returning();

            return new Response(JSON.stringify(newDoc), {
                status: 201,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // **PUT**: Update an existing document
        if (method === 'PUT') {
            const body = await request.json();
            const { id, title, category, description, fileUrl, version, effectiveDate, displayOrder } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: 'Document ID is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const [updatedDoc] = await db.update(schema.refereeRuleDocuments)
                .set({
                    title,
                    category,
                    description,
                    fileUrl,
                    version,
                    effectiveDate: effectiveDate || null,
                    displayOrder: displayOrder ?? 0,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(schema.refereeRuleDocuments.id, id))
                .returning();

            if (!updatedDoc) {
                return new Response(JSON.stringify({ error: 'Document not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            return new Response(JSON.stringify(updatedDoc), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // **DELETE**: Delete an existing document
        if (method === 'DELETE') {
            const id = url.searchParams.get('id');

            if (!id) {
                return new Response(JSON.stringify({ error: 'Document ID is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            await db.delete(schema.refereeRuleDocuments)
                .where(eq(schema.refereeRuleDocuments.id, id));

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        return new Response('Method Not Allowed', { status: 405 });
    } catch (error: any) {
        console.error('Referee Documents API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
}
