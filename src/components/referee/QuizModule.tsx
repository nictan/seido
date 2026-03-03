import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw, Trophy, Loader2 } from 'lucide-react';

type DBQuestion = {
    id: string;
    question_bank_id: string;
    question_text: string;
    correct_answer: boolean;
    explanation: string | null;
    category: string | null;
    rule_reference: string | null;
};

type QuizResult = {
    question: DBQuestion;
    userAnswer: boolean | null;
    isCorrect: boolean;
};

type QuizConfig = {
    quiz_question_count: number;
};

type QuizCategory = 'kata' | 'kumite' | 'mixed';
type Phase = 'select' | 'quiz' | 'results';

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

export function QuizModule() {
    const { session } = useAuth();
    const [phase, setPhase] = useState<Phase>('select');
    const [category, setCategory] = useState<QuizCategory>('kata');
    const [questions, setQuestions] = useState<DBQuestion[]>([]);
    const [allQuestions, setAllQuestions] = useState<Record<string, DBQuestion[]>>({});
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({ quiz_question_count: 10 });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(boolean | null)[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
    const [showReview, setShowReview] = useState<Record<number, boolean>>({});

    const results: QuizResult[] = questions.map((q, i) => ({
        question: q,
        userAnswer: answers[i] ?? null,
        isCorrect: answers[i] === q.correct_answer,
    }));
    const score = results.filter(r => r.isCorrect).length;

    // Pre-fetch questions + config on mount
    useEffect(() => {
        if (!session?.access_token) return;

        const headers = { Authorization: `Bearer ${session.access_token}` };

        // Fetch config
        fetch('/api/referee/config', { headers })
            .then(r => r.ok ? r.json() : null)
            .then(cfg => { if (cfg) setQuizConfig({ quiz_question_count: Number(cfg.quiz_question_count) }); });

        // Fetch question banks
        const fetchBank = async (discipline: string) => {
            const res = await fetch(`/api/referee/questions?discipline=${discipline}`, { headers });
            return res.ok ? (await res.json() as DBQuestion[]) : [];
        };
        Promise.all([fetchBank('kata'), fetchBank('kumite')]).then(([kata, kumite]) => {
            setAllQuestions({ kata, kumite, mixed: [...kata, ...kumite] });
        });
    }, [session?.access_token]);

    function startQuiz() {
        let pool = shuffle(allQuestions[category] || []);
        const picked = pool.slice(0, quizConfig.quiz_question_count);
        setQuestions(picked);
        setAnswers(new Array(picked.length).fill(null));
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setPhase('quiz');
    }

    function handleAnswer(answer: boolean) {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(answer);
    }

    function handleNext() {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = selectedAnswer;
        setAnswers(newAnswers);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setPhase('results');
        }
    }

    function restart() {
        setPhase('select');
        setSelectedAnswer(null);
        setShowReview({});
    }

    const bankLoaded = Object.keys(allQuestions).length > 0;
    const qCount = quizConfig.quiz_question_count;
    const scoreColor = score >= Math.ceil(qCount * 0.8) ? 'text-green-600' : score >= Math.ceil(qCount * 0.5) ? 'text-amber-600' : 'text-red-600';
    const scoreBg = score >= Math.ceil(qCount * 0.8) ? 'bg-green-50 border-green-200' : score >= Math.ceil(qCount * 0.5) ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

    // ── Select Phase ──────────────────────────────────────────────────────────
    if (phase === 'select') {
        return (
            <div className="max-w-md mx-auto space-y-6 py-4">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Quick Quiz</h2>
                    <p className="text-sm text-muted-foreground">
                        {qCount} random True / False questions from the official WKF referee exam bank.
                        Questions are always randomised.
                    </p>
                </div>

                {!bankLoaded ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading question banks...
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {([
                                { id: 'kata', label: '🥋 Kata', desc: `${allQuestions.kata?.length || 0} questions in bank` },
                                { id: 'kumite', label: '🥊 Kumite', desc: `${allQuestions.kumite?.length || 0} questions in bank` },
                                { id: 'mixed', label: '🔀 Mixed', desc: `${allQuestions.mixed?.length || 0} questions in bank` },
                            ] as { id: QuizCategory; label: string; desc: string }[]).map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setCategory(opt.id)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${category === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                >
                                    <div className="font-semibold">{opt.label}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={startQuiz}
                            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Start Quiz ({qCount} questions) →
                        </button>
                    </>
                )}
            </div>
        );
    }

    // ── Quiz Phase ────────────────────────────────────────────────────────────
    if (phase === 'quiz') {
        const q = questions[currentIndex];
        const progress = (currentIndex / questions.length) * 100;
        return (
            <div className="max-w-lg mx-auto space-y-6 py-4">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Question {currentIndex + 1} of {questions.length}</span>
                        {q.category && <span className="capitalize">{q.category}</span>}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <p className="text-base font-medium leading-relaxed">{q.question_text}</p>
                    {q.rule_reference && <p className="text-xs text-muted-foreground mt-2">Ref: {q.rule_reference}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {([true, false] as boolean[]).map(option => {
                        const label = option ? 'TRUE' : 'FALSE';
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === q.correct_answer;
                        let style = 'border-2 rounded-xl py-5 font-bold text-lg transition-all';
                        if (selectedAnswer === null) style += ' border-border hover:border-primary hover:bg-primary/5 cursor-pointer';
                        else if (isSelected && isCorrect) style += ' border-green-500 bg-green-50 text-green-700';
                        else if (isSelected && !isCorrect) style += ' border-red-500 bg-red-50 text-red-700';
                        else if (!isSelected && isCorrect) style += ' border-green-500 bg-green-50 text-green-700 opacity-70';
                        else style += ' border-border opacity-40';
                        return <button key={label} className={style} onClick={() => handleAnswer(option)}>{label}</button>;
                    })}
                </div>

                {selectedAnswer !== null && (
                    <div className={`p-4 rounded-xl border text-sm ${selectedAnswer === q.correct_answer ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <p className="font-semibold mb-1">{selectedAnswer === q.correct_answer ? '✅ Correct!' : '❌ Incorrect'}</p>
                        <p>{q.explanation || `Correct answer: ${q.correct_answer ? 'TRUE' : 'FALSE'}`}</p>
                    </div>
                )}

                {selectedAnswer !== null && (
                    <button onClick={handleNext} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors">
                        {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
                    </button>
                )}
            </div>
        );
    }

    // ── Results Phase ─────────────────────────────────────────────────────────
    return (
        <div className="max-w-lg mx-auto space-y-6 py-4">
            <div className={`border-2 rounded-2xl p-8 text-center ${scoreBg}`}>
                <Trophy className={`h-10 w-10 mx-auto mb-3 ${scoreColor}`} />
                <div className={`text-5xl font-black ${scoreColor}`}>{score}<span className="text-2xl font-semibold">/{questions.length}</span></div>
                <p className={`font-semibold mt-1 ${scoreColor}`}>
                    {score >= Math.ceil(qCount * 0.8) ? "Excellent — you're ready!" : score >= Math.ceil(qCount * 0.5) ? 'Good effort — keep studying.' : 'Keep practising — review below.'}
                </p>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Answer Review</h3>
                <button onClick={restart} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <RotateCcw className="h-3.5 w-3.5" /> Try Again
                </button>
            </div>

            <div className="space-y-3">
                {results.map((r, i) => (
                    <div key={r.question.id} className={`border rounded-xl overflow-hidden ${r.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                        <button onClick={() => setShowReview(p => ({ ...p, [i]: !p[i] }))} className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors">
                            {r.isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">{r.question.question_text}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Your answer: <span className={r.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{r.userAnswer === null ? '—' : r.userAnswer ? 'TRUE' : 'FALSE'}</span>
                                    {' · '}Correct: <span className="font-semibold">{r.question.correct_answer ? 'TRUE' : 'FALSE'}</span>
                                </p>
                            </div>
                            {showReview[i] ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </button>
                        {showReview[i] && (
                            <div className="px-4 pb-4 text-sm text-muted-foreground bg-muted/20 border-t border-border/50">
                                <p className="pt-3">{r.question.explanation || 'No explanation provided.'}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
