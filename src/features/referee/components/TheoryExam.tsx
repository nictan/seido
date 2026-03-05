import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

type ExamConfig = {
    exam_pass_threshold: number;
    exam_question_count: number;
    exam_time_mode: string;
    exam_total_time_seconds: number;
    exam_time_per_question_seconds: number;
};

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

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
    const [examConfig, setExamConfig] = useState<ExamConfig>({ exam_pass_threshold: 0.7, exam_question_count: 50, exam_time_mode: 'none', exam_total_time_seconds: 3600, exam_time_per_question_seconds: 60 });
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(boolean | null)[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
    const [showReview, setShowReview] = useState<Record<number, boolean>>({});
    const [elapsed, setElapsed] = useState(0);
    const [elapsedAtQStart, setElapsedAtQStart] = useState(0);
    const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

    const results: QuizResult[] = questions.map((q, i) => ({
        question: q,
        userAnswer: answers[i] ?? null,
        isCorrect: answers[i] === q.correct_answer,
    }));
    const score = results.filter(r => r.isCorrect).length;
    const percentage = questions.length > 0 ? score / questions.length : 0;
    const passed = percentage >= examConfig.exam_pass_threshold;

    useEffect(() => {
        if (!session?.access_token) return;
        const headers = { Authorization: `Bearer ${session.access_token}` };

        // Fetch config
        fetch('/api/referee/config', { headers })
            .then(r => r.ok ? r.json() : null)
            .then(cfg => {
                if (cfg) setExamConfig({
                    exam_pass_threshold: Number(cfg.exam_pass_threshold),
                    exam_question_count: Number(cfg.exam_question_count),
                    exam_time_mode: cfg.exam_time_mode || 'none',
                    exam_total_time_seconds: Number(cfg.exam_total_time_seconds),
                    exam_time_per_question_seconds: Number(cfg.exam_time_per_question_seconds),
                });
            });

        // Fetch bank counts
        Promise.all(
            (['kata', 'kumite'] as ExamCategory[]).map(d =>
                fetch(`/api/referee/questions?discipline=${d}`, { headers })
                    .then(r => r.ok ? r.json() : []).then((qs: DBQuestion[]) => [d, qs.length] as const)
            )
        ).then(entries => setBankCounts(Object.fromEntries(entries)));
    }, [session?.access_token]);

    async function startExam() {
        if (!session?.access_token) return;
        setLoading(true);
        const res = await fetch(`/api/referee/questions?discipline=${category}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        let bank: DBQuestion[] = res.ok ? await res.json() : [];
        bank = shuffle(bank).slice(0, examConfig.exam_question_count);

        setQuestions(bank);
        setAnswers(new Array(bank.length).fill(null));
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setElapsed(0);
        setElapsedAtQStart(0);

        const start = Date.now();
        const ref = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        setTimerRef(ref);
        setLoading(false);
        setPhase('exam');
    }

    async function handleNext() {
        setAnswers(prev => {
            const next = [...prev];
            next[currentIndex] = selectedAnswer;
            return next;
        });

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setElapsedAtQStart(elapsed);
        } else {
            if (timerRef) clearInterval(timerRef);

            // Save history
            try {
                const finalAnswers = [...answers];
                finalAnswers[currentIndex] = selectedAnswer; // Use latest since setState is async

                const finalResults = questions.map((q, i) => ({
                    question: q,
                    userAnswer: finalAnswers[i] ?? null,
                    isCorrect: finalAnswers[i] === q.correct_answer,
                }));
                const finalScore = finalResults.filter(r => r.isCorrect).length;
                const finalPercentage = questions.length > 0 ? finalScore / questions.length : 0;
                const finalPassed = finalPercentage >= examConfig.exam_pass_threshold;

                await fetch('/api/referee/history', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'exam',
                        category,
                        score: finalScore,
                        total_questions: questions.length,
                        passed: finalPassed,
                        details: finalResults.map(r => ({
                            question_id: r.question.id,
                            question_text: r.question.question_text,
                            user_answer: r.userAnswer,
                            correct_answer: r.question.correct_answer,
                            rule_reference: r.question.rule_reference
                        }))
                    })
                });
            } catch (err) {
                console.error("Failed to save history", err);
            }

            setPhase('results');
        }
    }

    useEffect(() => {
        if (phase !== 'exam') return;

        const { exam_time_mode, exam_total_time_seconds, exam_time_per_question_seconds } = examConfig;

        // Check overall total limit
        if (['total', 'both'].includes(exam_time_mode) && elapsed >= exam_total_time_seconds) {
            if (timerRef) clearInterval(timerRef);
            setPhase('results');
            return;
        }

        // Check per-question limit
        if (['per_question', 'both'].includes(exam_time_mode) && (elapsed - elapsedAtQStart) >= exam_time_per_question_seconds) {
            handleNext();
        }
    }, [elapsed, phase, examConfig, elapsedAtQStart]);

    function handleAnswer(answer: boolean) {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(answer);
    }

    function restart() {
        if (timerRef) clearInterval(timerRef);
        setPhase('select');
        setSelectedAnswer(null);
        setShowReview({});
        setElapsed(0);
        setElapsedAtQStart(0);
    }

    const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
    const banksLoaded = Object.keys(bankCounts).length > 0;

    // Time Mode render helpers
    const showTotalTime = ['total', 'both'].includes(examConfig.exam_time_mode);
    const showPerQuestionTime = ['per_question', 'both'].includes(examConfig.exam_time_mode);
    const qTimeElapsed = elapsed - elapsedAtQStart;

    // ── Select Phase ──────────────────────────────────────────────────────────
    if (phase === 'select') {
        return (
            <div className="max-w-md mx-auto space-y-6 py-4">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Simulated Theory Exam</h2>
                    <p className="text-sm text-muted-foreground">{examConfig.exam_question_count} questions · Pass mark {Math.round(examConfig.exam_pass_threshold * 100)}%</p>
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
                            <p>You need <strong>{Math.round(examConfig.exam_pass_threshold * 100)}%</strong> or above to pass.</p>
                            <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                {showTotalTime && <li>Global time limit: {Math.round(examConfig.exam_total_time_seconds / 60)} minutes. The exam will auto-submit when time expires.</li>}
                                {showPerQuestionTime && <li>Per-question limit: {examConfig.exam_time_per_question_seconds} seconds. Unanswered questions will auto-advance as incorrect.</li>}
                                {!showTotalTime && !showPerQuestionTime && <li>Untimed exam.</li>}
                            </ul>
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
                    <div className="text-sm font-mono font-bold shrink-0 flex flex-col items-end gap-1">
                        {showTotalTime && (
                            <div className="flex items-center gap-1">
                                <span className={examConfig.exam_total_time_seconds - elapsed <= 60 ? 'text-red-500' : 'text-muted-foreground'}>Total: {formatTime(examConfig.exam_total_time_seconds - elapsed)}</span>
                            </div>
                        )}
                        {showPerQuestionTime && (
                            <div className="flex items-center gap-1 text-xs">
                                <span className={examConfig.exam_time_per_question_seconds - qTimeElapsed <= 10 ? 'text-red-500' : 'text-muted-foreground'}>
                                    Q: {formatTime(examConfig.exam_time_per_question_seconds - qTimeElapsed)}
                                </span>
                            </div>
                        )}
                        {!showTotalTime && !showPerQuestionTime && (
                            <span className="text-muted-foreground">{formatTime(elapsed)}</span>
                        )}
                    </div>
                </div>

                <div className="bg-card border rounded-2xl p-6 shadow-sm min-h-[100px] flex flex-col justify-center">
                    <p className="text-base font-medium leading-relaxed">{q.question_text}</p>
                    <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-mono opacity-50">Ref: {q.id.split('-')[0]}</span>
                    </div>
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
                    <div className={`p-3 rounded-xl border text-sm flex justify-between items-center ${selectedAnswer === q.correct_answer ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <span className="font-medium">{selectedAnswer === q.correct_answer ? '✅ Correct' : `❌ Incorrect — correct answer: ${q.correct_answer ? 'TRUE' : 'FALSE'}`}</span>
                        <div className="flex items-center gap-2 opacity-80">
                            {q.rule_reference && <span className="text-[10px] font-semibold bg-background/50 px-1.5 py-0.5 rounded border border-border/50">Rule: {q.rule_reference}</span>}
                            <span className="text-[10px] font-mono bg-background/50 px-1.5 py-0.5 rounded border border-border/50">Ref: {q.id.split('-')[0]}</span>
                        </div>
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
                {!passed && <p className={`text-sm mt-2 font-medium ${resultColor}`}>You need {Math.ceil(questions.length * examConfig.exam_pass_threshold)} correct to pass.</p>}
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
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-muted-foreground">
                                        Your answer: <span className={r.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{r.userAnswer === null ? '—' : r.userAnswer ? 'TRUE' : 'FALSE'}</span>
                                        {' · '}Correct: <span className="font-semibold">{r.question.correct_answer ? 'TRUE' : 'FALSE'}</span>
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/60 font-mono">Ref: {r.question.id.split('-')[0]}</span>
                                </div>
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
