import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw, ClipboardCheck, Loader2 } from 'lucide-react';

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

type ExamCategory = 'kata' | 'kumite';
type ExamPhase = 'select' | 'exam' | 'results';
const PASS_THRESHOLD = 0.7;

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function TheoryExam() {
    const { session } = useAuth();
    const [phase, setPhase] = useState<ExamPhase>('select');
    const [category, setCategory] = useState<ExamCategory>('kata');
    const [questions, setQuestions] = useState<DBQuestion[]>([]);
    const [bankCounts, setBankCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(boolean | null)[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
    const [showReview, setShowReview] = useState<Record<number, boolean>>({});
    const [elapsed, setElapsed] = useState(0);
    const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

    const results: QuizResult[] = questions.map((q, i) => ({
        question: q,
        userAnswer: answers[i] ?? null,
        isCorrect: answers[i] === q.correct_answer,
    }));
    const score = results.filter(r => r.isCorrect).length;
    const percentage = questions.length > 0 ? score / questions.length : 0;
    const passed = percentage >= PASS_THRESHOLD;

    useEffect(() => {
        if (!session?.access_token) return;
        Promise.all(
            (['kata', 'kumite'] as ExamCategory[]).map(d =>
                fetch(`/api/referee/questions?discipline=${d}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                }).then(r => r.ok ? r.json() : []).then((qs: DBQuestion[]) => [d, qs.length] as const)
            )
        ).then(entries => setBankCounts(Object.fromEntries(entries)));
    }, [session?.access_token]);

    async function startExam() {
        if (!session?.access_token) return;
        setLoading(true);
        const res = await fetch(`/api/referee/questions?discipline=${category}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const bank: DBQuestion[] = res.ok ? await res.json() : [];
        setQuestions(bank);
        setAnswers(new Array(bank.length).fill(null));
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setElapsed(0);
        const start = Date.now();
        const ref = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
        setTimerRef(ref);
        setLoading(false);
        setPhase('exam');
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
            if (timerRef) clearInterval(timerRef);
            setPhase('results');
        }
    }

    function restart() {
        if (timerRef) clearInterval(timerRef);
        setPhase('select');
        setSelectedAnswer(null);
        setShowReview({});
        setElapsed(0);
    }

    const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
    const banksLoaded = Object.keys(bankCounts).length > 0;

    // ── Select Phase ──────────────────────────────────────────────────────────
    if (phase === 'select') {
        return (
            <div className="max-w-md mx-auto space-y-6 py-4">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Simulated Theory Exam</h2>
                    <p className="text-sm text-muted-foreground">Full question bank · Pass mark {PASS_THRESHOLD * 100}% · Timed</p>
                </div>

                {!banksLoaded ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading exam banks...
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {(['kata', 'kumite'] as ExamCategory[]).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${category === cat ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                >
                                    <div className="font-semibold capitalize">{cat === 'kata' ? '🥋 Kata Exam' : '🥊 Kumite Exam'}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {bankCounts[cat] || 0} questions · ~{bankCounts[cat] || 0} minutes
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                            <p className="font-semibold mb-1">⏱ Exam Conditions</p>
                            <p>All questions must be answered. You need <strong>{PASS_THRESHOLD * 100}%</strong> or above to pass.</p>
                        </div>
                        <button
                            onClick={startExam}
                            disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Loading exam...' : 'Begin Exam →'}
                        </button>
                    </>
                )}
            </div>
        );
    }

    // ── Exam Phase ────────────────────────────────────────────────────────────
    if (phase === 'exam') {
        const q = questions[currentIndex];
        return (
            <div className="max-w-lg mx-auto space-y-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 mr-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Q{currentIndex + 1} / {questions.length}</span>
                            <span className="capitalize font-medium">{category} exam</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <div className="text-sm font-mono font-bold text-muted-foreground shrink-0">{formatTime(elapsed)}</div>
                </div>

                <div className="bg-card border rounded-2xl p-6 shadow-sm min-h-[100px] flex flex-col justify-center">
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
                    <div className={`p-3 rounded-xl border text-sm ${selectedAnswer === q.correct_answer ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {selectedAnswer === q.correct_answer ? '✅ Correct' : `❌ Incorrect — correct answer: ${q.correct_answer ? 'TRUE' : 'FALSE'}`}
                    </div>
                )}

                {selectedAnswer !== null && (
                    <button onClick={handleNext} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors">
                        {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Exam'}
                    </button>
                )}
            </div>
        );
    }

    // ── Results Phase ─────────────────────────────────────────────────────────
    const resultBg = passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300';
    const resultColor = passed ? 'text-green-700' : 'text-red-700';

    return (
        <div className="max-w-lg mx-auto space-y-6 py-4">
            <div className={`border-2 rounded-2xl p-8 text-center ${resultBg}`}>
                <ClipboardCheck className={`h-10 w-10 mx-auto mb-3 ${resultColor}`} />
                <div className={`text-5xl font-black ${resultColor}`}>{score}<span className="text-2xl font-semibold">/{questions.length}</span></div>
                <div className={`text-lg font-bold mt-1 ${resultColor}`}>{Math.round(percentage * 100)}% — {passed ? '🎉 PASS' : '❌ FAIL'}</div>
                <p className="text-sm text-muted-foreground mt-2">Time taken: {formatTime(elapsed)}</p>
                {!passed && <p className={`text-sm mt-2 font-medium ${resultColor}`}>You need {Math.ceil(questions.length * PASS_THRESHOLD)} correct to pass.</p>}
            </div>

            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Full Answer Review</h3>
                <button onClick={restart} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <RotateCcw className="h-3.5 w-3.5" /> Retake Exam
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
