import { db } from '../_db.js';
import { profiles } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '../_auth.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const requesterId = payload.sub as string;
        const requesterProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, requesterId),
        });

        const isInstructor = requesterProfile?.isInstructor || false;
        const isAdmin = requesterProfile?.isAdmin || false;

        if (!isInstructor && !isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const url = new URL(request.url);
        const studentId = url.searchParams.get('studentId');

        if (!studentId) {
            return new Response(JSON.stringify({ error: 'Missing studentId' }), { status: 400 });
        }

        const student = await db.query.profiles.findFirst({
            where: eq(profiles.id, studentId),
            columns: {
                firstName: true,
                lastName: true,
                waiverPdfData: true
            }
        });

        if (!student || !student.waiverPdfData) {
            return new Response(JSON.stringify({ error: 'Waiver not found' }), { status: 404 });
        }

        // Return just the base64 string
        return new Response(JSON.stringify({ 
            pdfData: student.waiverPdfData,
            fileName: `waiver_${student.firstName}_${student.lastName}.pdf`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API: Instructor Waiver Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
