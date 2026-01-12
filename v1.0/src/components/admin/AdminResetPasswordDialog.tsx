
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LockKeyhole } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminResetPasswordDialogProps {
    studentId: string;
    studentName: string;
    studentEmail: string;
    trigger?: React.ReactNode;
}

export function AdminResetPasswordDialog({ studentId, studentName, studentEmail, trigger }: AdminResetPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { session } = useAuth();

    const handleReset = async () => {
        if (newPassword.length < 8) {
            toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    targetUserId: studentId,
                    newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast({ title: "Success", description: "Password updated successfully." });
                setOpen(false);
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast({ title: "Error", description: data.error || "Failed to update password.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" title="Reset Password">
                        <LockKeyhole className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password for {studentName}</DialogTitle>
                    <DialogDescription>
                        Manually set a new password for <strong>{studentEmail}</strong>. <br />
                        <span className="text-red-500 font-semibold">Warning: This will overwrite their existing password.</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-pass">New Password</Label>
                        <Input
                            id="new-pass"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-pass">Confirm Password</Label>
                        <Input
                            id="confirm-pass"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleReset} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Set Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
