-- Create enum for exam types
CREATE TYPE public.exam_type AS ENUM ('referee', 'coach');

-- Create enum for karate disciplines
CREATE TYPE public.karate_discipline AS ENUM ('kumite', 'kata');

-- Create enum for rule document categories
CREATE TYPE public.rule_category AS ENUM ('kumite', 'kata', 'para_karate', 'ranking', 'protocol', 'disciplinary');

-- Table for rule documents (PDFs)
CREATE TABLE public.referee_rule_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category rule_category NOT NULL,
  description TEXT,
  file_url TEXT,
  version TEXT,
  effective_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for question banks (e.g., "Kumite Referee Exam 2024")
CREATE TABLE public.referee_question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_type exam_type NOT NULL,
  discipline karate_discipline NOT NULL,
  version TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for individual questions (TRUE/FALSE format)
CREATE TABLE public.referee_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bank_id UUID NOT NULL REFERENCES public.referee_question_banks(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL,
  explanation TEXT,
  rule_reference TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_bank_id, question_number)
);

-- Table for user study progress per question bank
CREATE TABLE public.user_study_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_bank_id UUID NOT NULL REFERENCES public.referee_question_banks(id) ON DELETE CASCADE,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_bank_id)
);

-- Table for flashcard progress (spaced repetition)
CREATE TABLE public.user_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.referee_questions(id) ON DELETE CASCADE,
  confidence_level INTEGER NOT NULL DEFAULT 1 CHECK (confidence_level >= 1 AND confidence_level <= 5),
  times_reviewed INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Table for quiz attempts
CREATE TABLE public.user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_bank_id UUID NOT NULL REFERENCES public.referee_question_banks(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / NULLIF(total_questions, 0)) * 100, 2)) STORED,
  time_taken_seconds INTEGER,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.referee_rule_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referee_rule_documents (public read)
CREATE POLICY "Anyone can view rule documents"
ON public.referee_rule_documents FOR SELECT
USING (true);

CREATE POLICY "Admins can manage rule documents"
ON public.referee_rule_documents FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true));

-- RLS Policies for referee_question_banks (public read)
CREATE POLICY "Anyone can view active question banks"
ON public.referee_question_banks FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage question banks"
ON public.referee_question_banks FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true));

-- RLS Policies for referee_questions (public read)
CREATE POLICY "Anyone can view questions"
ON public.referee_questions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage questions"
ON public.referee_questions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true));

-- RLS Policies for user_study_progress (user owns their data)
CREATE POLICY "Users can view own study progress"
ON public.user_study_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study progress"
ON public.user_study_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study progress"
ON public.user_study_progress FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_flashcard_progress (user owns their data)
CREATE POLICY "Users can view own flashcard progress"
ON public.user_flashcard_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard progress"
ON public.user_flashcard_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress"
ON public.user_flashcard_progress FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_quiz_attempts (user owns their data)
CREATE POLICY "Users can view own quiz attempts"
ON public.user_quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
ON public.user_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_referee_questions_bank_id ON public.referee_questions(question_bank_id);
CREATE INDEX idx_user_study_progress_user ON public.user_study_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_user ON public.user_flashcard_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_next_review ON public.user_flashcard_progress(next_review_at);
CREATE INDEX idx_user_quiz_attempts_user ON public.user_quiz_attempts(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_referee_rule_documents_updated_at
BEFORE UPDATE ON public.referee_rule_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referee_question_banks_updated_at
BEFORE UPDATE ON public.referee_question_banks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referee_questions_updated_at
BEFORE UPDATE ON public.referee_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_study_progress_updated_at
BEFORE UPDATE ON public.user_study_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_flashcard_progress_updated_at
BEFORE UPDATE ON public.user_flashcard_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();