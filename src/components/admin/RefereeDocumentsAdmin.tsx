import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type RuleDocument = {
    id: string;
    title: string;
    category: 'kumite' | 'kata' | 'para_karate' | 'ranking' | 'protocol' | 'disciplinary';
    description: string | null;
    fileUrl: string | null;
    version: string | null;
    effectiveDate: string | null;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
};

export function RefereeDocumentsAdmin() {
    const { session, profile } = useAuth();
    const { toast } = useToast();
    const [documents, setDocuments] = useState<RuleDocument[]>([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<RuleDocument | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        category: 'kumite',
        description: '',
        fileUrl: '',
        version: '',
        effectiveDate: '',
        displayOrder: 0,
    });

    useEffect(() => {
        if (profile?.is_admin) {
            fetchDocuments();
        }
    }, [profile]);

    async function fetchDocuments() {
        setLoading(true);
        try {
            const res = await fetch('/api/referee/documents');
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            } else {
                toast({ title: 'Error', description: 'Failed to fetch documents', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    function handleAdd() {
        setEditingDoc(null);
        setForm({
            title: '',
            category: 'kumite',
            description: '',
            fileUrl: '',
            version: '',
            effectiveDate: '',
            displayOrder: 0,
        });
        setDialogOpen(true);
    }

    function handleEdit(doc: RuleDocument) {
        setEditingDoc(doc);
        setForm({
            title: doc.title,
            category: doc.category as any,
            description: doc.description || '',
            fileUrl: doc.fileUrl || '',
            version: doc.version || '',
            effectiveDate: doc.effectiveDate ? new Date(doc.effectiveDate).toISOString().split('T')[0] : '',
            displayOrder: doc.displayOrder,
        });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.title || !form.category) {
            toast({ title: 'Validation', description: 'Title and Category are required.', variant: 'destructive' });
            return;
        }

        const method = editingDoc ? 'PUT' : 'POST';
        const payload = {
            id: editingDoc?.id,
            ...form,
        };

        const res = await fetch('/api/referee/documents', {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast({ title: 'Success', description: 'Document saved successfully.' });
            setDialogOpen(false);
            fetchDocuments();
        } else {
            const err = await res.json();
            toast({ title: 'Error', description: err.error || 'Failed to save document', variant: 'destructive' });
        }
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/referee/documents?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });

        if (res.ok) {
            toast({ title: 'Success', description: 'Document deleted.' });
            setDeleteConfirm(null);
            fetchDocuments();
        } else {
            const err = await res.json();
            toast({ title: 'Error', description: err.error || 'Failed to delete document', variant: 'destructive' });
        }
    }

    return (
        <Card className="border-primary/10 mb-8">
            <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Official WKF Rulebooks
                        </CardTitle>
                        <CardDescription>
                            Manage the WKF Rulebooks shown in the Referee Prep module.
                        </CardDescription>
                    </div>
                    <Button onClick={handleAdd}>
                        <Plus className="h-4 w-4 mr-2" /> Add Document
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                        <h3 className="font-medium text-lg">No Rulebooks configured</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                            Click "Add Document" to insert external links that will be displayed in the Official Documents tab.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:border-border transition-colors group">
                                <div className="space-y-1 w-full max-w-2xl">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-base">{doc.title}</h4>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary uppercase tracking-wider">
                                            {doc.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground h-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {doc.description || 'No description'}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span>Order: {doc.displayOrder}</span>
                                        {doc.version && <span>v{doc.version}</span>}
                                        {doc.fileUrl && (
                                            <a href={doc.fileUrl} target="_blank" rel="noopener" className="text-primary hover:underline">
                                                Test Link
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center gap-2 shrink-0">
                                    {deleteConfirm === doc.id ? (
                                        <div className="flex items-center gap-2 bg-destructive/10 p-1.5 rounded-md">
                                            <span className="text-xs text-destructive font-medium px-2">Delete?</span>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)}>Yes</Button>
                                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>No</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(doc)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteConfirm(doc.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingDoc ? 'Edit Document' : 'Add Document'}</DialogTitle>
                        <DialogDescription>
                            Detailed metadata covering WKF rulebooks. URLs should link directly to PDF files if possible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Document Title *</Label>
                            <Input placeholder="e.g. WKF Kumite Rules" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kumite">Kumite</SelectItem>
                                    <SelectItem value="kata">Kata</SelectItem>
                                    <SelectItem value="para_karate">Para Karate</SelectItem>
                                    <SelectItem value="ranking">Ranking</SelectItem>
                                    <SelectItem value="protocol">Protocol</SelectItem>
                                    <SelectItem value="disciplinary">Disciplinary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Display Order</Label>
                            <Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>URL/Link to File *</Label>
                            <Input placeholder="https://..." value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Version (Optional)</Label>
                            <Input placeholder="e.g. 2026 V11" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Effective Date (Optional)</Label>
                            <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Description (Optional)</Label>
                            <Textarea placeholder="Short summary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-20" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Document</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
