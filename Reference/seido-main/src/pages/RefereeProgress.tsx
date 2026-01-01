import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserQuizAttempt, RefereeQuestionBank } from '@/types/referee';

type AttemptWithBank = UserQuizAttempt & { question_bank?: RefereeQuestionBank };

export default function RefereeProgress() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select(`
          *,
          referee_question_banks (
            name,
            exam_type,
            discipline
          )
        `)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const mapped = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        question_bank_id: item.question_bank_id,
        score: item.score,
        total_questions: item.total_questions,
        percentage: item.percentage,
        time_taken_seconds: item.time_taken_seconds,
        answers: item.answers as Record<string, boolean> | undefined,
        completed_at: item.completed_at,
        created_at: item.created_at,
        question_bank: item.referee_question_banks as unknown as RefereeQuestionBank,
      }));
      
      setAttempts(mapped);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0 
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length) 
      : 0,
    bestScore: attempts.length > 0 
      ? Math.max(...attempts.map(a => a.percentage || 0)) 
      : 0,
    totalTime: attempts.reduce((acc, a) => acc + (a.time_taken_seconds || 0), 0),
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/referee" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Referee Hub
            </Link>
            <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Please sign in to track your progress</p>
              <Link to="/auth" className="text-primary hover:underline">
                Sign in
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/referee" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Referee Hub
          </Link>
          <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
          <p className="mt-2 text-muted-foreground">
            Track your learning journey and exam performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Exams</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                {stats.totalAttempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                {stats.averageScore}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best Score</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                {stats.bestScore}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Study Time</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-500" />
                {formatTime(stats.totalTime)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Exam Attempts</CardTitle>
            <CardDescription>Your latest mock exam results</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exam attempts yet.</p>
                <Link to="/referee/quiz" className="text-primary hover:underline mt-2 inline-block">
                  Take your first mock exam
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <p className="font-medium">
                        {attempt.question_bank?.name || 'Unknown Exam'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.completed_at).toLocaleDateString()} • {attempt.total_questions} questions
                        {attempt.time_taken_seconds && ` • ${formatTime(attempt.time_taken_seconds)}`}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Score</span>
                        <span className={`font-medium ${
                          (attempt.percentage || 0) >= 75 ? 'text-green-600' : 
                          (attempt.percentage || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {attempt.percentage}%
                        </span>
                      </div>
                      <Progress 
                        value={attempt.percentage || 0} 
                        className={`h-2 ${
                          (attempt.percentage || 0) >= 75 ? '[&>div]:bg-green-500' : 
                          (attempt.percentage || 0) >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
