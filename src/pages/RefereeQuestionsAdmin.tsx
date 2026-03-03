import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

type Bank = {
    id: string;
    name: string;
    discipline: string;
    version: string;
    question_count: string;
};

type Question = {
    id: string;
    question_bank_id: string;
    question_number: number;
    question_text: string;
    correct_answer: boolean;
    explanation: string | null;
    rule_reference: string | null;
    category: string | null;
    is_active: boolean;
};

export default function RefereeQuestionsAdmin() {
    const { session, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [banks, setBanks] = useState<Bank[]>([]);
    const [expandedBank, setExpandedBank] = useState<string | null>(null);
    const [bankQuestions, setBankQuestions] = useState<Record<string, Question[]>>({});
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [form, setForm] = useState({
        question_bank_id: '',
        question_text: '',
        correct_answer: 'true',
        explanation: '',
        rule_reference: '',
        category: '',
    });

    useEffect(() => {
        if (!profile?.is_admin) {
            navigate('/');
            return;
        }
        fetchBanks();
    }, [profile]);

    async function fetchBanks() {
        try {
            const res = await fetch('/api/referee/questions?action=banks', {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (res.ok) setBanks(await res.json());
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to load question banks.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    async function fetchBankQuestions(bankId: string) {
        const res = await fetch(`/api/referee/questions?bankId=${bankId}`, {
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
            const qs = await res.json();
            setBankQuestions(prev => ({ ...prev, [bankId]: qs }));
        }
    }

    function toggleBank(bank: Bank) {
        if (expandedBank === bank.id) {
            setExpandedBank(null);
        } else {
            setExpandedBank(bank.id);
            if (!bankQuestions[bank.id]) {
                fetchBankQuestions(bank.id);
            }
        }
    }

    function openAddDialog(bankId: string) {
        setEditingQuestion(null);
        setForm({ question_bank_id: bankId, question_text: '', correct_answer: 'true', explanation: '', rule_reference: '', category: '' });
        setDialogOpen(true);
    }

    function openEditDialog(q: Question) {
        setEditingQuestion(q);
        setForm({
            question_bank_id: q.question_bank_id,
            question_text: q.question_text,
            correct_answer: String(q.correct_answer),
            explanation: q.explanation || '',
            rule_reference: q.rule_reference || '',
            category: q.category || '',
        });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.question_text.trim()) {
            toast({ title: 'Validation', description: 'Question text is required.', variant: 'destructive' });
            return;
        }

        const payload = {
            ...(editingQuestion ? { id: editingQuestion.id } : {}),
            question_bank_id: form.question_bank_id,
            question_text: form.question_text,
            correct_answer: form.correct_answer === 'true',
            explanation: form.explanation || null,
            rule_reference: form.rule_reference || null,
            category: form.category || null,
        };

        const res = await fetch('/api/referee/questions', {
            method: editingQuestion ? 'PUT' : 'POST',
            headers: {
                Authorization: `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast({ title: 'Saved', description: `Question ${editingQuestion ? 'updated' : 'added'} successfully.` });
            setDialogOpen(false);
            fetchBankQuestions(form.question_bank_id);
            fetchBanks(); // refresh counts
        } else {
            toast({ title: 'Error', description: 'Failed to save question.', variant: 'destructive' });
        }
    }

    async function handleDelete(q: Question) {
        const res = await fetch(`/api/referee/questions?id=${q.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
            toast({ title: 'Deleted', description: 'Question removed.' });
            setDeleteConfirm(null);
            fetchBankQuestions(q.question_bank_id);
            fetchBanks();
        } else {
            toast({ title: 'Error', description: 'Failed to delete question.', variant: 'destructive' });
        }
    }

    async function toggleActive(q: Question) {
        const res = await fetch('/api/referee/questions', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: q.id, is_active: !q.is_active }),
        });
        if (res.ok) {
            fetchBankQuestions(q.question_bank_id);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Referee Question Banks</h1>
                        <p className="text-muted-foreground text-sm">Manage WKF referee exam questions across Kata and Kumite</p>
                    </div>
                </div>

                {/* Banks */}
                <div className="space-y-4">
                    {banks.map(bank => {
                        const isExpanded = expandedBank === bank.id;
                        const qs = bankQuestions[bank.id] || [];
                        return (
                            <Card key={bank.id} className="overflow-hidden">
                                <button
                                    className="w-full text-left"
                                    onClick={() => toggleBank(bank)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-base">{bank.name}</CardTitle>
                                                <Badge variant="secondary" className="capitalize">{bank.discipline}</Badge>
                                                <Badge variant="outline">v{bank.version}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">{bank.question_count} questions</span>
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </button>

                                {isExpanded && (
                                    <CardContent className="pt-0">
                                        <div className="flex justify-end mb-4">
                                            <Button size="sm" onClick={() => openAddDialog(bank.id)}>
                                                <Plus className="h-4 w-4 mr-1" /> Add Question
                                            </Button>
                                        </div>

                                        {qs.length === 0 ? (
                                            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading questions...
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                                {qs.map((q) => (
                                                    <div
                                                        key={q.id}
                                                        className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${!q.is_active ? 'opacity-50 bg-muted/30' : 'bg-card'}`}
                                                    >
                                                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5 w-6 text-right">{q.question_number}.</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium leading-snug">{q.question_text}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${q.correct_answer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {q.correct_answer ? 'TRUE' : 'FALSE'}
                                                                </span>
                                                                {q.rule_reference && <span className="text-xs text-muted-foreground">{q.rule_reference}</span>}
                                                                {!q.is_active && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Disabled</span>}
                                                            </div>
                                                            {q.explanation && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.explanation}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => toggleActive(q)}
                                                                title={q.is_active ? 'Disable' : 'Enable'}
                                                                className="p-1 rounded hover:bg-muted transition-colors"
                                                            >
                                                                {q.is_active
                                                                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    : <XCircle className="h-4 w-4 text-gray-400" />}
                                                            </button>
                                                            <button
                                                                onClick={() => openEditDialog(q)}
                                                                className="p-1 rounded hover:bg-muted transition-colors"
                                                            >
                                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(q.id)}
                                                                className="p-1 rounded hover:bg-muted transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </main>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
                        <DialogDescription>
                            {editingQuestion ? 'Update the question details below.' : 'Add a new True/False question to the selected bank.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {!editingQuestion && (
                            <div className="space-y-1.5">
                                <Label>Question Bank</Label>
                                <Select value={form.question_bank_id} onValueChange={v => setForm(f => ({ ...f, question_bank_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                                    <SelectContent>
                                        {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>Question Text</Label>
                            <Textarea
                                value={form.question_text}
                                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                                placeholder="Enter the True/False statement..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Correct Answer</Label>
                            <Select value={form.correct_answer} onValueChange={v => setForm(f => ({ ...f, correct_answer: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">TRUE</SelectItem>
                                    <SelectItem value="false">FALSE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Explanation / Rationale <span className="text-muted-foreground font-normal">(shown to student after answering)</span></Label>
                            <Textarea
                                value={form.explanation}
                                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                                placeholder="Explain why the answer is TRUE or FALSE..."
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Rule Reference <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Input
                                    value={form.rule_reference}
                                    onChange={e => setForm(f => ({ ...f, rule_reference: e.target.value }))}
                                    placeholder="e.g. Art. 5.1"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Category <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Input
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    placeholder="e.g. Equipment"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>{editingQuestion ? 'Update' : 'Add Question'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Question?</DialogTitle>
                        <DialogDescription>This action cannot be undone. If you want to hide it temporarily, use the disable toggle instead.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                const q = Object.values(bankQuestions).flat().find(q => q.id === deleteConfirm);
                                if (q) handleDelete(q);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
