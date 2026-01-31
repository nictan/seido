export type ExamType = 'referee' | 'coach';
export type KarateDiscipline = 'kumite' | 'kata';
export type RuleCategory = 'kumite' | 'kata' | 'para_karate' | 'ranking' | 'protocol' | 'disciplinary';

export type RefereeRuleDocument = {
  id: string;
  title: string;
  category: RuleCategory;
  description?: string;
  file_url?: string;
  version?: string;
  effective_date?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type RefereeQuestionBank = {
  id: string;
  name: string;
  exam_type: ExamType;
  discipline: KarateDiscipline;
  version?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RefereeQuestion = {
  id: string;
  question_bank_id: string;
  question_number: number;
  question_text: string;
  correct_answer: boolean;
  explanation?: string;
  rule_reference?: string;
  category?: string;
  created_at: string;
  updated_at: string;
};

export type UserStudyProgress = {
  id: string;
  user_id: string;
  question_bank_id: string;
  questions_attempted: number;
  questions_correct: number;
  last_studied_at?: string;
  created_at: string;
  updated_at: string;
};

export type UserFlashcardProgress = {
  id: string;
  user_id: string;
  question_id: string;
  confidence_level: number;
  times_reviewed: number;
  times_correct: number;
  next_review_at?: string;
  created_at: string;
  updated_at: string;
};

export type UserQuizAttempt = {
  id: string;
  user_id: string;
  question_bank_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds?: number;
  answers?: Record<string, boolean>;
  completed_at: string;
  created_at: string;
};

export const RULE_CATEGORY_LABELS: Record<RuleCategory, string> = {
  kumite: 'Kumite Rules',
  kata: 'Kata Rules',
  para_karate: 'Para Karate',
  ranking: 'World Ranking',
  protocol: 'Protocol',
  disciplinary: 'Disciplinary Code',
};

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  referee: 'Referee',
  coach: 'Coach',
};

export const DISCIPLINE_LABELS: Record<KarateDiscipline, string> = {
  kumite: 'Kumite',
  kata: 'Kata',
};
