import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Trophy, RotateCcw, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RefereeQuestionBank, RefereeQuestion, EXAM_TYPE_LABELS, DISCIPLINE_LABELS } from '@/types/referee';
import { toast } from 'sonner';

type QuizState = 'config' | 'quiz' | 'results';

export default function RefereeQuiz() {
  const { user } = useAuth();
  const [questionBanks, setQuestionBanks] = useState<RefereeQuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<RefereeQuestionBank | null>(null);
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState<RefereeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('config');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionBanks();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizState === 'quiz' && timeStarted) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - timeStarted.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizState, timeStarted]);

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

  const startQuiz = async () => {
    if (!selectedBank) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('referee_questions')
        .select('*')
        .eq('question_bank_id', selectedBank.id)
        .order('question_number', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('No questions available for this exam yet');
        setLoading(false);
        return;
      }

      // Shuffle and take requested number
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
      
      setQuestions(selected as RefereeQuestion[]);
      setCurrentIndex(0);
      setAnswers({});
      setTimeStarted(new Date());
      setTimeElapsed(0);
      setQuizState('quiz');
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    const score = questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correct_answer ? 1 : 0);
    }, 0);

    // Save attempt if logged in
    if (user && selectedBank) {
      try {
        await supabase
          .from('user_quiz_attempts')
          .insert({
            user_id: user.id,
            question_bank_id: selectedBank.id,
            score,
            total_questions: questions.length,
            time_taken_seconds: timeElapsed,
            answers,
          });
      } catch (error) {
        console.error('Error saving quiz attempt:', error);
      }
    }

    setQuizState('results');
  };

  const resetQuiz = () => {
    setSelectedBank(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setQuizState('config');
    setTimeStarted(null);
    setTimeElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // Placeholder banks
  const displayBanks = questionBanks.length > 0 ? questionBanks : [
    { id: '1', name: 'Kumite Referee Exam 2024', exam_type: 'referee' as const, discipline: 'kumite' as const, description: '170+ questions', is_active: true, version: '2024', created_at: '', updated_at: '' },
    { id: '2', name: 'Kumite Coach Exam 2024', exam_type: 'coach' as const, discipline: 'kumite' as const, description: '110+ questions', is_active: true, version: '2024', created_at: '', updated_at: '' },
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
          <h1 className="text-3xl font-bold text-foreground">Mock Exam</h1>
          <p className="mt-2 text-muted-foreground">
            Test your knowledge with timed practice exams.
          </p>
        </div>

        {quizState === 'config' && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Configure Your Exam</CardTitle>
                <CardDescription>Select an exam type and number of questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Select Exam</Label>
                  <div className="grid gap-3">
                    {displayBanks.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBank(bank)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedBank?.id === bank.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{bank.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{EXAM_TYPE_LABELS[bank.exam_type]}</Badge>
                              <Badge variant="secondary" className="text-xs">{DISCIPLINE_LABELS[bank.discipline]}</Badge>
                            </div>
                          </div>
                          {selectedBank?.id === bank.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Number of Questions</Label>
                  <RadioGroup value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                    <div className="flex gap-4">
                      {[20, 50, 100].map((count) => (
                        <div key={count} className="flex items-center space-x-2">
                          <RadioGroupItem value={count.toString()} id={`count-${count}`} />
                          <Label htmlFor={`count-${count}`}>{count} questions</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={startQuiz}
                  disabled={!selectedBank || loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Exam
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {quizState === 'quiz' && questions.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                {formatTime(timeElapsed)}
              </div>
            </div>

            <Progress value={((currentIndex + 1) / questions.length) * 100} className="mb-6" />

            <Card className="mb-6">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">Q{questions[currentIndex].question_number}</Badge>
                <CardTitle className="text-lg leading-relaxed">
                  {questions[currentIndex].question_text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    className={`flex-1 h-14 ${answers[questions[currentIndex].id] === true ? 'ring-2 ring-primary' : ''}`}
                    variant={answers[questions[currentIndex].id] === true ? 'default' : 'outline'}
                    onClick={() => handleAnswer(questions[currentIndex].id, true)}
                  >
                    TRUE
                  </Button>
                  <Button 
                    className={`flex-1 h-14 ${answers[questions[currentIndex].id] === false ? 'ring-2 ring-primary' : ''}`}
                    variant={answers[questions[currentIndex].id] === false ? 'default' : 'outline'}
                    onClick={() => handleAnswer(questions[currentIndex].id, false)}
                  >
                    FALSE
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button 
                  className="flex-1"
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  className="flex-1"
                  onClick={submitQuiz}
                  disabled={Object.keys(answers).length !== questions.length}
                >
                  Submit Exam ({Object.keys(answers).length}/{questions.length} answered)
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    i === currentIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : answers[q.id] !== undefined
                        ? 'bg-muted text-foreground'
                        : 'bg-background border text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {quizState === 'results' && (
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  percentage >= 75 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Trophy className={`w-10 h-10 ${
                    percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <CardTitle className="text-2xl">
                  {percentage >= 75 ? 'Excellent!' : percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
                </CardTitle>
                <CardDescription>
                  You scored {score} out of {questions.length} ({percentage}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-green-600">{score}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-red-600">{questions.length - score}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{formatTime(timeElapsed)}</p>
                    <p className="text-xs text-muted-foreground">Time</p>
                  </div>
                </div>

                <Button className="w-full" onClick={resetQuiz}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Take Another Exam
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((q, i) => {
                  const isCorrect = answers[q.id] === q.correct_answer;
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">Q{i + 1}: {q.question_text}</p>
                          <p className="text-xs text-muted-foreground">
                            Your answer: <span className="font-medium">{answers[q.id] ? 'TRUE' : 'FALSE'}</span>
                            {!isCorrect && (
                              <span className="ml-2">
                                Correct: <span className="font-medium text-green-700">{q.correct_answer ? 'TRUE' : 'FALSE'}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
