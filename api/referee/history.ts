import { getSessionUser } from '../_auth';
import { adminDb } from '../_db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        const { type } = req.query; // 'quiz' or 'exam'

        try {
            let query = `
                SELECT id, type, category, score, total_questions, passed, created_at, details
                FROM referee_exam_history
                WHERE user_id = $1
            `;
            const params: any[] = [user.id];

            if (type === 'quiz' || type === 'exam') {
                query += ` AND type = $2`;
                params.push(type);
            }

            query += ` ORDER BY created_at DESC LIMIT 50`;

            const result = await adminDb.query(query, params);
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error('History fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch history' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { type, category, score, total_questions, passed, details } = req.body;

            if (!['quiz', 'exam'].includes(type) || !['kata', 'kumite'].includes(category)) {
                return res.status(400).json({ error: 'Invalid type or category' });
            }

            const client = await adminDb.connect();
            try {
                // Ensure the table exists using an explicit creation here since Vercel might not run the local sql migration automatically
                await client.query(`
                    CREATE TABLE IF NOT EXISTS referee_exam_history (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id TEXT NOT NULL,
                        type VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'exam')),
                        category VARCHAR(20) NOT NULL CHECK (category IN ('kata', 'kumite')),
                        score INTEGER NOT NULL,
                        total_questions INTEGER NOT NULL,
                        passed BOOLEAN NOT NULL DEFAULT false,
                        details JSONB NOT NULL DEFAULT '[]',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_referee_exam_history_user_id ON referee_exam_history(user_id);
                `);

                const query = `
                    INSERT INTO referee_exam_history (user_id, type, category, score, total_questions, passed, details)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `;
                const params = [
                    user.id,
                    type,
                    category,
                    score,
                    total_questions,
                    !!passed,
                    JSON.stringify(details || [])
                ];

                const result = await client.query(query, params);
                return res.status(201).json({ id: result.rows[0].id, message: 'History saved successfully' });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('History save error:', error);
            return res.status(500).json({ error: 'Failed to save history' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
