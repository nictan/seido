import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function ResetPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isTokenMissing, setIsTokenMissing] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) {
            setIsTokenMissing(true);
        }
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Passwords do not match",
                description: "Please ensure both password fields are identical.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await resetPassword(newPassword);
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Reset Failed",
                    description: error,
                });
            } else {
                setIsSuccess(true);
                toast({
                    title: "Password Reset Successful",
                    description: "Your password has been updated. You can now sign in.",
                });
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <KeyRound className="h-12 w-12 text-primary mx-auto" />
                        <h1 className="text-3xl font-bold tracking-tight">New Password</h1>
                        <p className="text-muted-foreground">Secure your Seido account</p>
                    </div>

                    <Card className="dojo-card">
                        {isTokenMissing ? (
                            <div className="p-6 text-center space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">Invalid Reset Link</h3>
                                    <p className="text-muted-foreground">The reset token is missing from the URL. Please use the link sent to your email or request a new one.</p>
                                </div>
                                <Button className="w-full" onClick={() => navigate("/auth")}>
                                    Back to Sign In
                                </Button>
                            </div>
                        ) : isSuccess ? (
                            <div className="p-6 text-center space-y-4">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">Success!</h3>
                                    <p className="text-muted-foreground">Your password has been reset successfully.</p>
                                </div>
                                <Button className="w-full" onClick={() => navigate("/auth")}>
                                    Go to Sign In
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleReset}>
                                <CardHeader>
                                    <CardTitle>Set New Password</CardTitle>
                                    <CardDescription>Enter a strong password for your student profile.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                        Update Password
                                    </Button>
                                </CardFooter>
                            </form>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
