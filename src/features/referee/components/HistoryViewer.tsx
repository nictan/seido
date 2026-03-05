import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, History, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

type HistoryDetail = {
    question_id: string;
    question_text: string;
    user_answer: boolean | null;
    correct_answer: boolean;
    rule_reference: string | null;
};

type HistoryRecord = {
    id: string;
    type: 'quiz' | 'exam';
    category: 'kata' | 'kumite';
    score: number;
    total_questions: number;
    passed: boolean;
    created_at: string;
    details: HistoryDetail[];
};

export function HistoryViewer() {
    const { session } = useAuth();
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

    useEffect(() => {
        if (!session?.access_token) return;

        fetch('/api/referee/history', {
            headers: { Authorization: `Bearer ${session.access_token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                setRecords(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [session?.access_token]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (selectedRecord) {
        return (
            <div className="max-w-2xl mx-auto space-y-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
                >
                    ← Back to History
                </button>

                <div className="bg-card border rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold capitalize">{selectedRecord.category} {selectedRecord.type} Review</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Completed {formatDistanceToNow(new Date(selectedRecord.created_at), { addSuffix: true })}
                            </p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border ${selectedRecord.passed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <div className="text-xl font-black text-center">{selectedRecord.score}/{selectedRecord.total_questions}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-center">{selectedRecord.passed ? 'Passed' : 'Failed'}</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {selectedRecord.details.map((d, i) => {
                        const isCorrect = d.user_answer === d.correct_answer;
                        return (
                            <div key={i} className={`p-4 border rounded-xl ${isCorrect ? 'border-green-200/50 bg-green-50/10' : 'border-red-200/50 bg-red-50/10'}`}>
                                <div className="flex gap-3 items-start">
                                    {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-snug">{d.question_text}</p>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                            <p className="text-xs text-muted-foreground">
                                                Your answer: <span className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{d.user_answer === null ? '—' : d.user_answer ? 'TRUE' : 'FALSE'}</span>
                                                <span className="mx-1.5">|</span>
                                                Correct: <span className="font-semibold">{d.correct_answer ? 'TRUE' : 'FALSE'}</span>
                                            </p>
                                            {d.rule_reference && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">Ref: {d.rule_reference}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="text-center py-20 border rounded-2xl bg-muted/20">
                <History className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="font-bold text-lg">No history found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    You haven't completed any quizzes or exams yet. Start practicing to see your performance history here!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-lg font-bold mb-4">Your Recent Performance</h2>
            <div className="grid gap-3">
                {records.map(record => (
                    <Card
                        key={record.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors group"
                        onClick={() => setSelectedRecord(record)}
                    >
                        <CardHeader className="p-4 flex flex-row items-center justify-between gap-4 py-3">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${record.type === 'exam' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {record.passed ? <CheckCircle className="h-5 w-5 text-green-600" /> : <History className="h-5 w-5" />}
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold capitalize flex items-center gap-2">
                                        {record.category} {record.type}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className={`font-bold text-sm ${record.passed ? 'text-green-600' : 'text-red-600'}`}>
                                        {record.score}/{record.total_questions}
                                    </div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Score</div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
