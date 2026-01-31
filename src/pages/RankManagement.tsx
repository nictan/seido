
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Rank } from "@/types/database";

export default function RankManagement() {
    const { session, profile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [ranks, setRanks] = useState<Rank[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);
    const [formData, setFormData] = useState({
        displayName: "",
        rankOrder: 0,
        kyu: "",
        dan: "",
        beltColor: "#000000",
        stripes: 0,
        isDefaultRank: false
    });

    const fetchRanks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ranks');
            if (res.ok) {
                const data = await res.json();
                setRanks(data);
            } else {
                toast({ title: "Error", description: "Failed to fetch ranks", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to fetch ranks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.access_token && profile?.is_admin) {
            fetchRanks();
        } else if (!authLoading && !profile?.is_admin) {
            setLoading(false); // Stop loading if not admin (will show access denied)
        }
    }, [session, profile, authLoading]);

    const handleOpenDialog = (rank: Rank | null) => {
        setEditingRank(rank);
        if (rank) {
            setFormData({
                displayName: rank.displayName,
                rankOrder: rank.rankOrder,
                kyu: rank.kyu ? rank.kyu.toString() : "",
                dan: rank.dan ? rank.dan.toString() : "",
                beltColor: rank.beltColor,
                stripes: rank.stripes || 0,
                isDefaultRank: rank.isDefaultRank || false
            });
        } else {
            // New Rank Defaults
            const maxOrder = ranks.length > 0 ? Math.max(...ranks.map(r => r.rankOrder)) : 0;
            setFormData({
                displayName: "",
                rankOrder: maxOrder + 10,
                kyu: "",
                dan: "",
                beltColor: "#ffffff",
                stripes: 0,
                isDefaultRank: false
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const url = '/api/ranks';
            const method = editingRank ? 'PUT' : 'POST';
            const body = editingRank ? { ...formData, id: editingRank.id } : formData;

            const res = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast({ title: "Success", description: `Rank ${editingRank ? 'updated' : 'created'} successfully.` });
                setDialogOpen(false);
                fetchRanks();
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error || "Operation failed", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
        }
    };

    const handleDelete = async (rank: Rank) => {
        if (!window.confirm(`Are you sure you want to delete ${rank.displayName}? This may affect grading history!`)) return;

        try {
            const res = await fetch('/api/ranks', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: rank.id })
            });

            if (res.ok) {
                toast({ title: "Deleted", description: "Rank deleted successfully." });
                fetchRanks();
            } else {
                toast({ title: "Error", description: "Failed to delete rank.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
        }
    };

    if (authLoading || loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (!profile?.is_admin) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="p-8 text-center text-red-500">Access Denied. Admin privileges required.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Rank Management</h1>
                            <p className="text-muted-foreground mt-1">Configure karate belts and ranking order.</p>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenDialog(null)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Rank
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Ranks</CardTitle>
                        <CardDescription>Ranks are ordered by "Rank Order" (ascending).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Order</TableHead>
                                        <TableHead>Display Name</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Belt Color</TableHead>
                                        <TableHead>Stripes</TableHead>
                                        <TableHead>Default?</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ranks.map((rank) => (
                                        <TableRow key={rank.id}>
                                            <TableCell>{rank.rankOrder}</TableCell>
                                            <TableCell className="font-medium">{rank.displayName}</TableCell>
                                            <TableCell>
                                                {rank.kyu ? `${rank.kyu} Kyu` : rank.dan ? `${rank.dan} Dan` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border shadow-sm"
                                                        style={{ backgroundColor: rank.beltColor }}
                                                    />
                                                    <span className="text-xs text-muted-foreground hidden sm:inline-block">{rank.beltColor}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{rank.stripes > 0 ? `${rank.stripes} Stripe(s)` : '-'}</TableCell>
                                            <TableCell>
                                                {rank.isDefaultRank && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Default</span>}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(rank)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(rank)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRank ? "Edit Rank" : "Add New Rank"}</DialogTitle>
                            <DialogDescription>Configure rank details.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="displayName" className="text-right">Name</Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="col-span-3"
                                    placeholder="e.g. White Belt"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rankOrder" className="text-right">Order</Label>
                                <Input
                                    id="rankOrder"
                                    type="number"
                                    value={formData.rankOrder}
                                    onChange={(e) => setFormData({ ...formData, rankOrder: parseInt(e.target.value) })}
                                    className="col-span-3"
                                    placeholder="Order number (low = junior)"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Level</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Input
                                        placeholder="Kyu"
                                        type="number"
                                        value={formData.kyu}
                                        onChange={(e) => setFormData({ ...formData, kyu: e.target.value, dan: "" })}
                                    />
                                    <Input
                                        placeholder="Dan"
                                        type="number"
                                        value={formData.dan}
                                        onChange={(e) => setFormData({ ...formData, dan: e.target.value, kyu: "" })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="beltColor" className="text-right">Color</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Input
                                        id="beltColor"
                                        type="color"
                                        value={formData.beltColor}
                                        onChange={(e) => setFormData({ ...formData, beltColor: e.target.value })}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.beltColor}
                                        onChange={(e) => setFormData({ ...formData, beltColor: e.target.value })}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stripes" className="text-right">Stripes</Label>
                                <Input
                                    id="stripes"
                                    type="number"
                                    value={formData.stripes}
                                    onChange={(e) => setFormData({ ...formData, stripes: parseInt(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isDefault" className="text-right">Default</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Switch
                                        id="isDefault"
                                        checked={formData.isDefaultRank}
                                        onCheckedChange={(c) => setFormData({ ...formData, isDefaultRank: c })}
                                    />
                                    <span className="text-xs text-muted-foreground">Assign to new students automatically?</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>{editingRank ? "Update" : "Create"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
