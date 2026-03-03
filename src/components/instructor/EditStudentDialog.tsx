import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Rank } from "@/types/database";

interface EditStudentDialogProps {
    student: {
        id: string; // Profile ID
        firstName: string;
        lastName: string;
        email: string;
        mobile?: string;
        dojo?: string;
        currentRank?: string; // Display Name
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditStudentDialog({ student, open, onOpenChange, onSuccess }: EditStudentDialogProps) {
    const { session } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [ranks, setRanks] = useState<Rank[]>([]);

    const [formData, setFormData] = useState({
        email: "",
        mobile: "",
        dojo: "HQ",
        rankName: ""
    });

    useEffect(() => {
        if (open && student) {
            setFormData({
                email: student.email,
                mobile: student.mobile || "",
                dojo: student.dojo || "HQ",
                rankName: student.currentRank || ""
            });
            fetchRanks();
        }
    }, [open, student]);

    const fetchRanks = async () => {
        try {
            const res = await fetch('/api/ranks');
            if (res.ok) {
                const data = await res.json();
                // Sort ranks by order if possible, assuming data is array
                if (Array.isArray(data)) {
                    data.sort((a: any, b: any) => (a.rankOrder || 0) - (b.rankOrder || 0));
                    setRanks(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch ranks", e);
        }
    };

    const handleSave = async () => {
        if (!student) return;
        setLoading(true);

        try {
            const res = await fetch('/api/instructor/students', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    studentId: student.id, // Profile ID
                    email: formData.email,
                    mobile: formData.mobile,
                    dojo: formData.dojo,
                    rank: formData.rankName
                })
            });

            if (res.ok) {
                toast({ title: "Success", description: "Student details updated." });
                onSuccess();
                onOpenChange(false);
            } else {
                const data = await res.json();
                toast({ title: "Error", description: data.error || "Failed to update.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Unexpected error.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                        Update details for {student.firstName} {student.lastName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                            id="mobile"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="dojo">Dojo</Label>
                        <Select
                            value={formData.dojo}
                            onValueChange={(v) => setFormData({ ...formData, dojo: v })}
                        >
                            <SelectTrigger id="dojo">
                                <SelectValue placeholder="Select Dojo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HQ">HQ</SelectItem>
                                <SelectItem value="TP">TP</SelectItem>
                                <SelectItem value="SIT">SIT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="rank">Rank</Label>
                        <Select
                            value={formData.rankName}
                            onValueChange={(v) => setFormData({ ...formData, rankName: v })}
                        >
                            <SelectTrigger id="rank">
                                <SelectValue placeholder="Select Rank" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {ranks.map((r) => (
                                    <SelectItem key={r.id} value={r.displayName}>
                                        {r.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Updating email will update their login. Updating rank creates a new history entry.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
