import { db } from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { sql } from 'drizzle-orm';

export const config = { runtime: 'edge' };

// Referee question bank IDs (referee exam type only)
const BANK_DISCIPLINE_MAP: Record<string, string> = {}; // populated dynamically

export default async function handler(request: Request) {
    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const profileResult = await db.execute(
        sql`SELECT is_admin FROM profiles WHERE user_id = ${payload.sub}`
    );
    const isAdmin = (profileResult.rows[0] as any)?.is_admin || false;

    const url = new URL(request.url);

    // ── GET banks (admin) ─────────────────────────────────────────────────────
    if (request.method === 'GET' && url.searchParams.get('action') === 'banks') {
        const banks = await db.execute(sql`
            SELECT b.*, COUNT(q.id) as question_count
            FROM referee_question_banks b
            LEFT JOIN referee_questions q ON q.question_bank_id = b.id AND q.is_active = true
            WHERE b.exam_type = 'referee'
            GROUP BY b.id ORDER BY b.discipline, b.name
        `);
        return new Response(JSON.stringify(banks.rows), { status: 200 });
    }

    // ── GET questions ─────────────────────────────────────────────────────────
    if (request.method === 'GET') {
        const discipline = url.searchParams.get('discipline'); // 'kata' | 'kumite'
        const bankId = url.searchParams.get('bankId');        // specific bank

        let rows;
        if (bankId) {
            rows = await db.execute(sql`
                SELECT q.* FROM referee_questions q
                WHERE q.question_bank_id = ${bankId} AND q.is_active = true
                ORDER BY q.question_number ASC
            `);
        } else if (discipline) {
            // Get from referee exam bank for this discipline
            rows = await db.execute(sql`
                SELECT q.* FROM referee_questions q
                JOIN referee_question_banks b ON b.id = q.question_bank_id
                WHERE b.discipline = ${discipline}::karate_discipline
                  AND b.exam_type = 'referee'
                  AND q.is_active = true
                ORDER BY q.question_number ASC
            `);
        } else {
            // Return all referee questions
            rows = await db.execute(sql`
                SELECT q.*, b.discipline FROM referee_questions q
                JOIN referee_question_banks b ON b.id = q.question_bank_id
                WHERE b.exam_type = 'referee' AND q.is_active = true
                ORDER BY b.discipline, q.question_number ASC
            `);
        }
        return new Response(JSON.stringify(rows.rows), { status: 200 });
    }

    // All writes below are admin-only
    if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // ── POST (Create question) ────────────────────────────────────────────────
    if (request.method === 'POST') {
        const body = await request.json();
        const { question_text, correct_answer, explanation, rule_reference, category, question_bank_id } = body;
        if (!question_text || correct_answer === undefined || !question_bank_id) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const maxNum = await db.execute(
            sql`SELECT COALESCE(MAX(question_number), 0) as max FROM referee_questions WHERE question_bank_id = ${question_bank_id}`
        );
        const nextNum = Number((maxNum.rows[0] as any).max) + 1;

        const result = await db.execute(sql`
            INSERT INTO referee_questions (question_bank_id, question_number, question_text, correct_answer, explanation, rule_reference, category, is_active, display_order)
            VALUES (${question_bank_id}, ${nextNum}, ${question_text}, ${correct_answer}, ${explanation || null}, ${rule_reference || null}, ${category || null}, true, ${nextNum})
            RETURNING *
        `);
        return new Response(JSON.stringify(result.rows[0]), { status: 201 });
    }

    // ── PUT (Update question) ─────────────────────────────────────────────────
    if (request.method === 'PUT') {
        const body = await request.json();
        const { id, question_text, correct_answer, explanation, rule_reference, category, is_active } = body;
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

        await db.execute(sql`
            UPDATE referee_questions SET
                question_text = COALESCE(${question_text ?? null}, question_text),
                correct_answer = COALESCE(${correct_answer ?? null}, correct_answer),
                explanation = COALESCE(${explanation ?? null}, explanation),
                rule_reference = COALESCE(${rule_reference ?? null}, rule_reference),
                category = COALESCE(${category ?? null}, category),
                is_active = COALESCE(${is_active ?? null}, is_active),
                updated_at = NOW()
            WHERE id = ${id}
        `);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
        await db.execute(sql`DELETE FROM referee_questions WHERE id = ${id}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

