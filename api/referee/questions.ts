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
            // Get from the currently active bank for this discipline
            const configRes = await db.execute(sql`SELECT active_kata_bank_id, active_kumite_bank_id FROM referee_quiz_config LIMIT 1`);
            const cfg = configRes.rows[0];
            const activeBankId = discipline === 'kata' ? cfg?.active_kata_bank_id : cfg?.active_kumite_bank_id;

            if (activeBankId) {
                rows = await db.execute(sql`
                    SELECT q.* FROM referee_questions q
                    WHERE q.question_bank_id = ${activeBankId} AND q.is_active = true
                    ORDER BY q.question_number ASC
                `);
            } else {
                // Fallback: just get any bank for this discipline
                rows = await db.execute(sql`
                    SELECT q.* FROM referee_questions q
                    JOIN referee_question_banks b ON b.id = q.question_bank_id
                    WHERE b.discipline = ${discipline}::karate_discipline
                      AND b.exam_type = 'referee'
                      AND q.is_active = true
                    ORDER BY q.question_number ASC
                `);
            }
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

    // ── POST (Create question or Bulk Import) ─────────────────────────────────
    if (request.method === 'POST') {
        const urlParams = new URL(request.url);

        // Handle Bulk Import Action
        if (urlParams.searchParams.get('action') === 'import') {
            const body = await request.json();
            const { bank_id, new_bank_name, discipline, questions } = body;

            if (!questions || !Array.isArray(questions)) {
                return new Response(JSON.stringify({ error: 'Array of questions required' }), { status: 400 });
            }

            let targetBankId = bank_id;

            // Create a new bank if requested
            if (new_bank_name && discipline) {
                const bRes = await db.execute(sql`
                    INSERT INTO referee_question_banks (name, discipline, exam_type, created_by, is_active)
                    VALUES (${new_bank_name}, ${discipline}::karate_discipline, 'referee', ${payload.sub}, true)
                    RETURNING id
                `);
                targetBankId = bRes.rows[0].id;
            }

            if (!targetBankId) {
                return new Response(JSON.stringify({ error: 'Valid bank_id or new_bank_name required' }), { status: 400 });
            }

            // Get max current number
            const maxNumResult = await db.execute(
                sql`SELECT COALESCE(MAX(question_number), 0) as max FROM referee_questions WHERE question_bank_id = ${targetBankId}`
            );
            let nextNum = Number((maxNumResult.rows[0] as any).max) + 1;

            let inserted = 0;
            // Drizzle HTTP has a payload size limit so we do a simple loop, perfectly fine for a few dozen admin records
            for (const q of questions) {
                if (!q.question_text || q.correct_answer === undefined) continue;
                await db.execute(sql`
                    INSERT INTO referee_questions (question_bank_id, question_number, question_text, correct_answer, explanation, rule_reference, category, is_active, display_order)
                    VALUES (${targetBankId}, ${nextNum}, ${q.question_text}, ${q.correct_answer}, ${q.explanation || null}, ${q.rule_reference || null}, ${q.category || null}, true, ${nextNum})
                `);
                nextNum++;
                inserted++;
            }

            return new Response(JSON.stringify({ success: true, count: inserted, bank_id: targetBankId }), { status: 201 });
        }

        // Handle Single Question Create (existing behavior)
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

