import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { GraduationCap, LogIn, UserPlus, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signUp, forgetPassword } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = location.state?.from?.pathname || "/";

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [isResetSent, setIsResetSent] = useState(false);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await signIn(loginEmail, loginPassword);
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: error,
                });
            } else {
                toast({
                    title: "Welcome back!",
                    description: "Successfully signed in to Seido.",
                });
                navigate(from, { replace: true });
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

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await forgetPassword(forgotEmail);
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Request Failed",
                    description: error,
                });
            } else {
                setIsResetSent(true);
                toast({
                    title: "Email Sent!",
                    description: "Check your inbox for password reset instructions.",
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await signUp(signupEmail, signupPassword, {
                firstName,
                lastName,
            });
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Signup Failed",
                    description: error,
                });
            } else {
                toast({
                    title: "Account Created!",
                    description: "Your student profile is ready. Welcome to the dojo!",
                });
                navigate(from, { replace: true });
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
                        <GraduationCap className="h-12 w-12 text-primary mx-auto" />
                        <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
                        <p className="text-muted-foreground">Manage your Seido Karate journey</p>
                    </div>

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">New Student</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <Card className="dojo-card">
                                {isForgotPassword ? (
                                    <form onSubmit={handleForgotPassword}>
                                        <CardHeader>
                                            <CardTitle>Reset Password</CardTitle>
                                            <CardDescription>
                                                {isResetSent
                                                    ? "Check your email for the reset link. Once you've reset your password, you can sign in below."
                                                    : "Enter your email address and we'll send you a link to reset your password."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {!isResetSent && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="forgot-email">Email</Label>
                                                    <Input
                                                        id="forgot-email"
                                                        type="email"
                                                        placeholder="student@seido.sg"
                                                        value={forgotEmail}
                                                        onChange={(e) => setForgotEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex flex-col space-y-4">
                                            {!isResetSent && (
                                                <Button className="w-full" type="submit" disabled={isLoading}>
                                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                                                    Send Reset Link
                                                </Button>
                                            )}
                                            <Button variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)} type="button">
                                                Back to Sign In
                                            </Button>
                                        </CardFooter>
                                    </form>
                                ) : (
                                    <form onSubmit={handleLogin}>
                                        <CardHeader>
                                            <CardTitle>Welcome Back</CardTitle>
                                            <CardDescription>Enter your credentials to access your profile.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="sensei@seido.sg"
                                                    value={loginEmail}
                                                    onChange={(e) => setLoginEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password">Password</Label>
                                                    <Button
                                                        variant="link"
                                                        className="px-0 font-normal text-xs text-muted-foreground hover:text-primary"
                                                        onClick={() => setIsForgotPassword(true)}
                                                        type="button"
                                                    >
                                                        Forgot password?
                                                    </Button>
                                                </div>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" type="submit" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                                Sign In
                                            </Button>
                                        </CardFooter>
                                    </form>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="signup">
                            <Card className="dojo-card">
                                <CardHeader>
                                    <CardTitle>Join the Dojo</CardTitle>
                                    <CardDescription>Create your student account to track your progress.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSignup}>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    placeholder="Ichiro"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    placeholder="Hayashi"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="student@seido.sg"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                            Create Account
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
