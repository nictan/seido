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
