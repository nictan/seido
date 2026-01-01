import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RefereeQuestionBank, RefereeQuestion, EXAM_TYPE_LABELS, DISCIPLINE_LABELS } from '@/types/referee';
import { toast } from 'sonner';

type StudyState = 'select' | 'study' | 'reveal';

export default function RefereeLearn() {
  const { user } = useAuth();
  const [questionBanks, setQuestionBanks] = useState<RefereeQuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<RefereeQuestionBank | null>(null);
  const [questions, setQuestions] = useState<RefereeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyState, setStudyState] = useState<StudyState>('select');
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionBanks();
  }, []);

  const fetchQuestionBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('referee_question_banks')
        .select('*')
        .eq('is_active', true)
        .order('discipline', { ascending: true });

      if (error) throw error;
      setQuestionBanks(data as RefereeQuestionBank[] || []);
    } catch (error) {
      console.error('Error fetching question banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const startStudy = async (bank: RefereeQuestionBank) => {
    setSelectedBank(bank);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('referee_questions')
        .select('*')
        .eq('question_bank_id', bank.id)
        .order('question_number', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('No questions available for this exam yet');
        setLoading(false);
        return;
      }

      // Shuffle questions for study mode
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setQuestions(shuffled as RefereeQuestion[]);
      setCurrentIndex(0);
      setStudyState('study');
      setSessionStats({ correct: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: boolean) => {
    setUserAnswer(answer);
    setStudyState('reveal');
    
    const isCorrect = answer === questions[currentIndex].correct_answer;
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Update flashcard progress if logged in
    if (user) {
      updateFlashcardProgress(questions[currentIndex].id, isCorrect);
    }
  };

  const updateFlashcardProgress = async (questionId: string, isCorrect: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('question_id', questionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_flashcard_progress')
          .update({
            times_reviewed: existing.times_reviewed + 1,
            times_correct: existing.times_correct + (isCorrect ? 1 : 0),
            confidence_level: isCorrect 
              ? Math.min(5, existing.confidence_level + 1)
              : Math.max(1, existing.confidence_level - 1),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_flashcard_progress')
          .insert({
            user_id: user!.id,
            question_id: questionId,
            times_reviewed: 1,
            times_correct: isCorrect ? 1 : 0,
            confidence_level: isCorrect ? 2 : 1,
          });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer(null);
      setStudyState('study');
    }
  };

  const resetStudy = () => {
    setSelectedBank(null);
    setQuestions([]);
    setCurrentIndex(0);
    setStudyState('select');
    setUserAnswer(null);
    setSessionStats({ correct: 0, total: 0 });
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Placeholder banks if none exist
  const displayBanks = questionBanks.length > 0 ? questionBanks : [
    { id: '1', name: 'Kumite Referee Exam 2024', exam_type: 'referee' as const, discipline: 'kumite' as const, description: '170+ TRUE/FALSE questions', is_active: true, version: '2024', created_at: '', updated_at: '' },
    { id: '2', name: 'Kumite Coach Exam 2024', exam_type: 'coach' as const, discipline: 'kumite' as const, description: '110+ TRUE/FALSE questions', is_active: true, version: '2024', created_at: '', updated_at: '' },
    { id: '3', name: 'Kata Referee Exam 2024', exam_type: 'referee' as const, discipline: 'kata' as const, description: 'Coming soon', is_active: true, version: '2024', created_at: '', updated_at: '' },
    { id: '4', name: 'Kata Coach Exam 2024', exam_type: 'coach' as const, discipline: 'kata' as const, description: 'Coming soon', is_active: true, version: '2024', created_at: '', updated_at: '' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/referee" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Referee Hub
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Study Mode</h1>
          <p className="mt-2 text-muted-foreground">
            Practice with flashcards and track your progress.
          </p>
        </div>

        {studyState === 'select' && (
          <div className="grid gap-4 md:grid-cols-2">
            {displayBanks.map((bank) => (
              <Card 
                key={bank.id} 
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
                onClick={() => startStudy(bank)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">{EXAM_TYPE_LABELS[bank.exam_type]}</Badge>
                      <Badge variant="secondary">{DISCIPLINE_LABELS[bank.discipline]}</Badge>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-2">{bank.name}</CardTitle>
                  <CardDescription>{bank.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {(studyState === 'study' || studyState === 'reveal') && currentQuestion && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={resetStudy}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Exit Study
              </Button>
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <Progress value={progress} className="mb-6" />

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Q{currentQuestion.question_number}</Badge>
                  {currentQuestion.category && (
                    <Badge variant="secondary">{currentQuestion.category}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studyState === 'study' && (
                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 h-16 text-lg"
                      variant="outline"
                      onClick={() => handleAnswer(true)}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                      TRUE
                    </Button>
                    <Button 
                      className="flex-1 h-16 text-lg"
                      variant="outline"
                      onClick={() => handleAnswer(false)}
                    >
                      <XCircle className="w-5 h-5 mr-2 text-red-600" />
                      FALSE
                    </Button>
                  </div>
                )}

                {studyState === 'reveal' && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      userAnswer === currentQuestion.correct_answer 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {userAnswer === currentQuestion.correct_answer ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-700">Correct!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-700">Incorrect</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm">
                        The correct answer is: <strong>{currentQuestion.correct_answer ? 'TRUE' : 'FALSE'}</strong>
                      </p>
                    </div>

                    {currentQuestion.explanation && (
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                      </div>
                    )}

                    {currentQuestion.rule_reference && (
                      <p className="text-xs text-muted-foreground">
                        Reference: {currentQuestion.rule_reference}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      {currentIndex < questions.length - 1 ? (
                        <Button className="flex-1" onClick={nextQuestion}>
                          Next Question
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button className="flex-1" onClick={resetStudy}>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Finish & Return
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session Progress</span>
                  <span className="font-medium">
                    {sessionStats.correct} / {sessionStats.total} correct
                    {sessionStats.total > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({Math.round((sessionStats.correct / sessionStats.total) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && studyState !== 'select' && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </main>
    </div>
  );
}
