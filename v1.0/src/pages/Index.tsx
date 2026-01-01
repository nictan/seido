import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { User, ClipboardList, GraduationCap, ArrowRight } from "lucide-react";

export default function Index() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Welcome to Seido Karate</h1>
                        <p className="text-xl text-muted-foreground">My Seido - Student Portal</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="dojo-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/profile")}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Karate Profile
                                </CardTitle>
                                <CardDescription>Your personal student journey</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Manage your personal details and instructor status.</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="ghost" className="w-full justify-between" onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}>
                                    View Profile <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="dojo-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/grading")}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    My Grading Card
                                </CardTitle>
                                <CardDescription>Track your rank progression</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">View your current grade, next grading requirements, and history.</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="ghost" className="w-full justify-between" onClick={(e) => { e.stopPropagation(); navigate("/grading"); }}>
                                    Check Ranking <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="dojo-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/referee")}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    My Training Buddy
                                </CardTitle>
                                <CardDescription>Interactive scoring & rules</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Practice scoring and learn competition rules with AI assistance.</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="ghost" className="w-full justify-between" onClick={(e) => { e.stopPropagation(); navigate("/referee"); }}>
                                    Start Practice <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
