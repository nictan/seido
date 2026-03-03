import { db } from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { sql } from 'drizzle-orm';

export const config = { runtime: 'edge' };

export type QuizConfig = {
    id: string;
    quiz_question_count: number;
    quiz_shuffle: boolean;
    exam_time_limit_enabled: boolean;
    exam_time_per_question_seconds: number;
    exam_pass_threshold: number;
    exam_question_count: number;
    exam_time_mode: string;
    exam_total_time_seconds: number;
    active_kata_bank_id: string | null;
    active_kumite_bank_id: string | null;
    updated_at: string;
    // Joined fields (not in DB)
    active_kata_bank_name?: string;
    active_kumite_bank_name?: string;
};

export default async function handler(request: Request) {
    const payload = await verifyAuth(request);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // ── GET (public — all authenticated users need config to run quizzes) ────
    if (request.method === 'GET') {
        const result = await db.execute(sql`
            SELECT 
                c.*,
                bk.name AS active_kata_bank_name,
                bu.name AS active_kumite_bank_name
            FROM referee_quiz_config c
            LEFT JOIN referee_question_banks bk ON c.active_kata_bank_id = bk.id
            LEFT JOIN referee_question_banks bu ON c.active_kumite_bank_id = bu.id
            LIMIT 1
        `);
        const row = result.rows[0] || {
            quiz_question_count: 10,
            quiz_shuffle: true,
            exam_time_limit_enabled: false,
            exam_time_per_question_seconds: 60,
            exam_pass_threshold: 0.70,
            exam_question_count: 50,
            exam_time_mode: 'none',
            exam_total_time_seconds: 3600,
            active_kata_bank_id: null,
            active_kumite_bank_id: null,
        };
        return new Response(JSON.stringify(row), { status: 200 });
    }

    // ── PUT (admin only) ─────────────────────────────────────────────────────
    if (request.method === 'PUT') {
        const profileResult = await db.execute(
            sql`SELECT is_admin FROM profiles WHERE user_id = ${payload.sub}`
        );
        const isAdmin = (profileResult.rows[0] as any)?.is_admin || false;
        if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const body = await request.json();
        const {
            quiz_question_count,
            quiz_shuffle,
            exam_time_limit_enabled,
            exam_time_per_question_seconds,
            exam_pass_threshold,
            exam_question_count,
            exam_time_mode,
            exam_total_time_seconds,
            active_kata_bank_id,
            active_kumite_bank_id,
        } = body;

        await db.execute(sql`
            UPDATE referee_quiz_config SET
                quiz_question_count = COALESCE(${quiz_question_count ?? null}, quiz_question_count),
                quiz_shuffle = COALESCE(${quiz_shuffle ?? null}, quiz_shuffle),
                exam_time_limit_enabled = COALESCE(${exam_time_limit_enabled ?? null}, exam_time_limit_enabled),
                exam_time_per_question_seconds = COALESCE(${exam_time_per_question_seconds ?? null}, exam_time_per_question_seconds),
                exam_pass_threshold = COALESCE(${exam_pass_threshold ?? null}, exam_pass_threshold),
                exam_question_count = COALESCE(${exam_question_count ?? null}, exam_question_count),
                exam_time_mode = COALESCE(${exam_time_mode ?? null}, exam_time_mode),
                exam_total_time_seconds = COALESCE(${exam_total_time_seconds ?? null}, exam_total_time_seconds),
                active_kata_bank_id = COALESCE(${active_kata_bank_id ?? null}, active_kata_bank_id),
                active_kumite_bank_id = COALESCE(${active_kumite_bank_id ?? null}, active_kumite_bank_id),
                updated_at = NOW()
        `);

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
