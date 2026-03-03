import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen, Settings2, Save } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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

type QuizConfig = {
    quiz_question_count: number;
    quiz_shuffle: boolean;
    exam_time_limit_enabled: boolean;
    exam_time_per_question_seconds: number;
    exam_pass_threshold: number;
    exam_question_count: number;
    exam_time_mode: string;
    exam_total_time_seconds: number;
    active_kata_bank_id: string | null;
    active_kumite_bank_id: string | null;
};

export default function RefereeQuestionsAdmin() {
    const { session, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [banks, setBanks] = useState<Bank[]>([]);
    const [expandedBank, setExpandedBank] = useState<string | null>(null);
    const [bankQuestions, setBankQuestions] = useState<Record<string, Question[]>>({});
    const [loading, setLoading] = useState(true);
    const [configSaving, setConfigSaving] = useState(false);
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        quiz_question_count: 10,
        quiz_shuffle: true,
        exam_time_limit_enabled: false,
        exam_time_per_question_seconds: 60,
        exam_pass_threshold: 0.70,
        exam_question_count: 50,
        exam_time_mode: 'none',
        exam_total_time_seconds: 3600,
        active_kata_bank_id: null,
        active_kumite_bank_id: null,
    });

    // Import state
    const [importBankMode, setImportBankMode] = useState<'existing' | 'new'>('existing');
    const [importTargetBankId, setImportTargetBankId] = useState('');
    const [importDiscipline, setImportDiscipline] = useState('');
    const [importNewBankName, setImportNewBankName] = useState('');
    const [importJson, setImportJson] = useState('');
    const [isImporting, setIsImporting] = useState(false);

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
        fetchConfig();
    }, [profile]);

    async function fetchConfig() {
        const res = await fetch('/api/referee/config', {
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) {
            const cfg = await res.json();
            setQuizConfig({
                quiz_question_count: Number(cfg.quiz_question_count),
                quiz_shuffle: cfg.quiz_shuffle,
                exam_time_limit_enabled: cfg.exam_time_limit_enabled,
                exam_time_per_question_seconds: Number(cfg.exam_time_per_question_seconds),
                exam_pass_threshold: Number(cfg.exam_pass_threshold),
                exam_question_count: Number(cfg.exam_question_count),
                exam_time_mode: cfg.exam_time_mode || 'none',
                exam_total_time_seconds: Number(cfg.exam_total_time_seconds),
                active_kata_bank_id: cfg.active_kata_bank_id || null,
                active_kumite_bank_id: cfg.active_kumite_bank_id || null,
            });
        }
    }

    async function handleImportSelection() {
        if (!importJson.trim()) {
            toast({ title: 'Validation', description: 'Please paste JSON payload.', variant: 'destructive' });
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(importJson);
        } catch (e) {
            toast({ title: 'Format Error', description: 'Invalid JSON.', variant: 'destructive' });
            return;
        }

        if (!Array.isArray(parsed)) {
            toast({ title: 'Format Error', description: 'JSON must be an array of questions.', variant: 'destructive' });
            return;
        }

        setIsImporting(true);
        const res = await fetch('/api/referee/questions?action=import', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bank_id: importBankMode === 'existing' ? importTargetBankId : undefined,
                new_bank_name: importBankMode === 'new' ? importNewBankName : undefined,
                discipline: importBankMode === 'new' ? importDiscipline : undefined,
                questions: parsed
            }),
        });
        setIsImporting(false);

        if (res.ok) {
            const result = await res.json();
            toast({ title: 'Success', description: `Imported ${result.count} questions.` });
            setImportJson('');
            fetchBanks(); // refresh counts
        } else {
            const err = await res.json();
            toast({ title: 'Import Failed', description: err.error || 'Unknown error occurred.', variant: 'destructive' });
        }
    }

    async function saveConfig() {
        setConfigSaving(true);
        const res = await fetch('/api/referee/config', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quizConfig),
        });
        setConfigSaving(false);
        if (res.ok) {
            toast({ title: 'Saved', description: 'Quiz configuration updated.' });
        } else {
            toast({ title: 'Error', description: 'Failed to save configuration.', variant: 'destructive' });
        }
    }

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

                {/* Quiz / Exam Configuration */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-primary" />
                            <CardTitle className="text-base">Quiz &amp; Exam Configuration</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Active Banks Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                            <div className="space-y-1.5">
                                <Label className="text-primary font-semibold">Active Kata Bank Version</Label>
                                <Select value={quizConfig.active_kata_bank_id || ''} onValueChange={v => setQuizConfig({ ...quizConfig, active_kata_bank_id: v })}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select Bank" /></SelectTrigger>
                                    <SelectContent>
                                        {banks.filter(b => b.discipline === 'kata').map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name} (v{b.version})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Used for all Kata quizzes and exams.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-primary font-semibold">Active Kumite Bank Version</Label>
                                <Select value={quizConfig.active_kumite_bank_id || ''} onValueChange={v => setQuizConfig({ ...quizConfig, active_kumite_bank_id: v })}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select Bank" /></SelectTrigger>
                                    <SelectContent>
                                        {banks.filter(b => b.discipline === 'kumite').map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name} (v{b.version})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Used for all Kumite quizzes and exams.</p>
                            </div>
                        </div>

                        {/* Config Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                            {/* Quiz settings */}
                            <div>
                                <p className="text-sm font-semibold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> Quick Quiz</p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz_question_count">Questions per Quiz</Label>
                                        <Input
                                            id="quiz_question_count"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={quizConfig.quiz_question_count}
                                            onChange={e => setQuizConfig(c => ({ ...c, quiz_question_count: Math.max(1, Number(e.target.value)) }))}
                                        />
                                        <p className="text-xs text-muted-foreground">Drawn randomly from the active bank.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Exam settings */}
                            <div className="space-y-4 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
                                <p className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4 text-muted-foreground" /> Theory Exam</p>
                                <div className="space-y-1.5">
                                    <Label htmlFor="exam_question_count">Questions per Exam</Label>
                                    <Input
                                        id="exam_question_count"
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={quizConfig.exam_question_count}
                                        onChange={e => setQuizConfig(c => ({ ...c, exam_question_count: Math.max(1, Number(e.target.value)) }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Sets length of the formal exam.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="exam_pass_threshold">Pass Mark (%)</Label>
                                    <Input
                                        id="exam_pass_threshold"
                                        type="number"
                                        min={50}
                                        max={100}
                                        value={Math.round(quizConfig.exam_pass_threshold * 100)}
                                        onChange={e => setQuizConfig(c => ({ ...c, exam_pass_threshold: Math.min(1, Math.max(0.5, Number(e.target.value) / 100)) }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Time Limit Mode</Label>
                                    <Select value={quizConfig.exam_time_mode} onValueChange={v => setQuizConfig({ ...quizConfig, exam_time_mode: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Untimed)</SelectItem>
                                            <SelectItem value="per_question">Per Question Only</SelectItem>
                                            <SelectItem value="total">Overall Total Time Only</SelectItem>
                                            <SelectItem value="both">Both (Total + Per Question)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {['per_question', 'both'].includes(quizConfig.exam_time_mode) && (
                                        <div className="space-y-1.5 bg-yellow-50/50 p-2 rounded border border-yellow-100">
                                            <Label htmlFor="exam_time_per_q" className="text-xs">Seconds / Question</Label>
                                            <Input
                                                id="exam_time_per_q"
                                                type="number"
                                                className="h-8 text-sm"
                                                min={10} max={300}
                                                value={quizConfig.exam_time_per_question_seconds}
                                                onChange={e => setQuizConfig(c => ({ ...c, exam_time_per_question_seconds: Math.max(10, Number(e.target.value)) }))}
                                            />
                                        </div>
                                    )}
                                    {['total', 'both'].includes(quizConfig.exam_time_mode) && (
                                        <div className="space-y-1.5 bg-yellow-50/50 p-2 rounded border border-yellow-100">
                                            <Label htmlFor="exam_total_time" className="text-xs">Total Exam Mins</Label>
                                            <Input
                                                id="exam_total_time"
                                                type="number"
                                                className="h-8 text-sm"
                                                min={1} max={300}
                                                value={Math.round(quizConfig.exam_total_time_seconds / 60)}
                                                onChange={e => setQuizConfig(c => ({ ...c, exam_total_time_seconds: Math.max(1, Number(e.target.value)) * 60 }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={saveConfig} disabled={configSaving} className="gap-2">
                                {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Configuration
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b border-border/50 mb-4 bg-muted/10 rounded-t-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Bulk Import JSON</CardTitle>
                                <CardDescription className="mt-1">Add many questions into a bank quickly.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.open('/import-template.json', '_blank')}>Template 📄</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <Label>Destination</Label>
                                <div className="flex gap-2 mb-2 p-1 bg-muted rounded-md w-fit">
                                    <button
                                        onClick={() => setImportBankMode('existing')}
                                        className={`px-3 py-1 text-sm rounded-sm font-medium transition-colors ${importBankMode === 'existing' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                                    >
                                        Existing Bank
                                    </button>
                                    <button
                                        onClick={() => setImportBankMode('new')}
                                        className={`px-3 py-1 text-sm rounded-sm font-medium transition-colors ${importBankMode === 'new' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}`}
                                    >
                                        New Bank Version
                                    </button>
                                </div>

                                {importBankMode === 'existing' ? (
                                    <Select value={importTargetBankId} onValueChange={setImportTargetBankId}>
                                        <SelectTrigger><SelectValue placeholder="Select target bank" /></SelectTrigger>
                                        <SelectContent>
                                            {banks.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name} (v{b.version} - {b.discipline})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                                        <div className="space-y-1.5">
                                            <Label>Bank Name &amp; Label</Label>
                                            <Input placeholder="e.g. WKF Kata Exam 2026..." value={importNewBankName} onChange={e => setImportNewBankName(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Discipline</Label>
                                            <Select value={importDiscipline} onValueChange={setImportDiscipline}>
                                                <SelectTrigger><SelectValue placeholder="Select discipline" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kata">Kata</SelectItem>
                                                    <SelectItem value="kumite">Kumite</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex justify-between">
                                    <span>JSON Payload</span>
                                    <span className="text-xs font-normal text-muted-foreground">Array of objects mapping to schema fields</span>
                                </Label>
                                <Textarea
                                    className="font-mono text-xs h-32 md:h-full resize-y min-h-[140px]"
                                    placeholder={`[
  {
    "question_text": "Is this a valid question?",
    "correct_answer": true,
    "explanation": "Yes because XYZ...",
    "rule_reference": "Article 10"
  }
]`}
                                    value={importJson}
                                    onChange={e => setImportJson(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleImportSelection} disabled={isImporting} className="gap-2">
                                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Run Import
                            </Button>
                        </div>
                    </CardContent>
                </Card>

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
