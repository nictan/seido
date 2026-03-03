
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GradingApplication } from "@/types/database";
import { Header } from "@/components/layout/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Rank, GradingPeriod } from "@/types/database";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, CheckCircle, XCircle, ClipboardList, Pencil, RefreshCw, Search, Filter } from "lucide-react";
import { EditStudentDialog } from "@/components/instructor/EditStudentDialog";

// Types for fetched data


type StudentSummary = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    dojo: string;
    currentRank: string;
    rankColor: string;
    mobile?: string;
};

export default function InstructorDashboard() {
    const { session, profile, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [applications, setApplications] = useState<GradingApplication[]>([]);

    const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [loading, setLoading] = useState(true);

    // Grading Period Dialog State
    const [createPeriodOpen, setCreatePeriodOpen] = useState(false);
    const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
    const [newPeriodData, setNewPeriodData] = useState({
        title: '',
        gradingDate: '',
        description: '',
        maxApplications: 20,
        allowedRankIds: [] as string[]
    });

    // Grading Dialog State
    const [selectedGradingApp, setSelectedGradingApp] = useState<GradingApplication | null>(null);
    const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
    const [gradingDecision, setGradingDecision] = useState<'Pass' | 'Fail'>('Pass');

    const [gradingNotes, setGradingNotes] = useState('');

    // Search & Filter State
    const [appSearchQuery, setAppSearchQuery] = useState('');
    const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentDojoFilter, setStudentDojoFilter] = useState<'all' | 'HQ' | 'TP' | 'SIT'>('all');

    const [editStudentOpen, setEditStudentOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentSummary | null>(null);

    const handleEditStudent = (student: StudentSummary) => {
        setEditingStudent(student);
        setEditStudentOpen(true);
    };



    // Students Fetching
    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/instructor/students', {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    // Applications Fetching
    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/grading/applications', {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };

    // Ranks Fetching
    const fetchRanks = async () => {
        try {
            const res = await fetch('/api/ranks');
            if (res.ok) {
                const data = await res.json();
                setRanks(data);
            }
        } catch (error) {
            console.error("Failed to fetch ranks", error);
        }
    };

    // Grading Periods Fetching
    const fetchGradingPeriods = async () => {
        try {
            const res = await fetch('/api/grading/period');
            if (res.ok) {
                const data = await res.json();
                setGradingPeriods(data);
            }
        } catch (error) {
            console.error("Failed to fetch grading periods", error);
        }
    };

    const openCreatePeriodDialog = () => {
        setEditingPeriodId(null);
        setNewPeriodData({ title: '', gradingDate: '', description: '', maxApplications: 20, allowedRankIds: [] });
        setCreatePeriodOpen(true);
    };

    const openEditPeriodDialog = (period: GradingPeriod) => {
        setEditingPeriodId(period.id);
        setNewPeriodData({
            title: period.title,
            // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
            gradingDate: new Date(period.gradingDate).toISOString().slice(0, 16),
            description: period.description || '',
            maxApplications: period.maxApplications || 0,
            allowedRankIds: period.allowedRanks ? period.allowedRanks.map((r: any) => r.rankId) : []
        });
        setCreatePeriodOpen(true);
    };

    const handleSavePeriod = async () => {
        try {
            const url = '/api/grading/period';
            const method = editingPeriodId ? 'PUT' : 'POST';
            const body = editingPeriodId ? { ...newPeriodData, id: editingPeriodId } : newPeriodData;

            const res = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast({ title: "Success", description: `Grading Period ${editingPeriodId ? 'updated' : 'created'}.` });
                setCreatePeriodOpen(false);
                setNewPeriodData({ title: '', gradingDate: '', description: '', maxApplications: 20, allowedRankIds: [] });
                setEditingPeriodId(null);
                fetchGradingPeriods();

            } else {
                toast({ title: "Error", description: `Failed to ${editingPeriodId ? 'update' : 'create'} grading period.`, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${editingPeriodId ? 'update' : 'create'} grading period.`, variant: "destructive" });
        }
    };

    const handleApprove = async (appId: string) => {
        try {
            const res = await fetch('/api/grading/applications', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: appId, status: 'Approved' })
            });
            if (res.ok) {
                toast({ title: "Approved", description: "Application approved successfully." });
                fetchApplications();

            } else {
                toast({ title: "Error", description: "Failed to approve application.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to approve application.", variant: "destructive" });
        }
    };

    const handleReject = async (appId: string) => {
        try {
            const res = await fetch('/api/grading/applications', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: appId, status: 'Rejected' })
            });
            if (res.ok) {
                toast({ title: "Rejected", description: "Application rejected." });
                fetchApplications();
                fetchApplications();
            } else {
                toast({ title: "Error", description: "Failed to reject application.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to reject application.", variant: "destructive" });
        }
    };

    const openGradingDialog = (app: GradingApplication) => {
        setSelectedGradingApp(app);
        setGradingDecision('Pass');
        setGradingNotes((app as any).gradingNotes || ''); // Pre-fill if editing? Or just empty.
        setGradingDialogOpen(true);
    };

    const submitGradingResult = async () => {
        if (!selectedGradingApp) return;

        try {
            const res = await fetch('/api/grading/applications', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: selectedGradingApp.id,
                    gradingStatus: gradingDecision,
                    gradingNotes: gradingNotes
                })
            });

            if (res.ok) {
                toast({ title: "Success", description: `Grading result recorded: ${gradingDecision}` });
                setGradingDialogOpen(false);
                fetchApplications(); // Refresh list
                fetchStudents(); // Refresh student ranks

            } else {
                toast({ title: "Error", description: "Failed to record grading result.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to record grading result.", variant: "destructive" });
        }
    };

    const filteredApplications = applications.filter(app => {
        // 1. Text Search (Student Name)
        if (appSearchQuery) {
            const query = appSearchQuery.toLowerCase();
            const studentName = `${(app as any).profile?.firstName} ${(app as any).profile?.lastName}`.toLowerCase();
            if (!studentName.includes(query)) return false;
        }

        // 2. Status Filter
        if (appStatusFilter === 'pending') return app.status === 'Submitted';
        if (appStatusFilter === 'approved') return app.status === 'Approved';
        if (appStatusFilter === 'rejected') return app.status === 'Rejected' || app.status === 'Withdrawn' || app.status === 'Void';

        return true;
    });

    useEffect(() => {
        if (session?.access_token && (profile?.is_instructor || profile?.is_admin)) {
            Promise.all([fetchStudents(), fetchApplications(), fetchGradingPeriods(), fetchRanks()]).finally(() => setLoading(false));
        }
    }, [session, profile]);

    if (authLoading || loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (!profile?.is_instructor && !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="p-8 text-center text-red-500">Access Denied. Instructor privileges required.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your students and grading activities.</p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20">
                        {profile?.karate_profile?.dojo || 'HQ'}
                    </Badge>
                </div>

                <Tabs defaultValue="applications" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="applications">Applications</TabsTrigger>
                        <TabsTrigger value="periods">Grading Periods</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                    </TabsList>

                    <TabsContent value="periods" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Grading Periods</h2>
                            <Button onClick={openCreatePeriodDialog}>
                                <Calendar className="mr-2 h-4 w-4" />
                                New Grading Period
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {gradingPeriods.map((period) => (
                                <Card key={period.id} className="relative">
                                    <CardHeader>
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-lg">{period.title}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    new Date(period.gradingDate) < new Date() ? 'secondary' :
                                                        period.status === 'Upcoming' ? 'default' : 'secondary'
                                                }>
                                                    {new Date(period.gradingDate) < new Date() ? 'Past' : period.status}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => openEditPeriodDialog(period)}
                                                    title="Edit Period"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription>
                                            {new Date(period.gradingDate).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm space-y-2">
                                            <p>{period.description || "No description"}</p>
                                            <div>
                                                <span className="font-semibold">Allowed Ranks:</span>
                                                {period.allowedRanks && period.allowedRanks.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {period.allowedRanks.map((r) => (
                                                            <Badge key={r.rank.id} variant="outline" className="text-xs">
                                                                {r.rank.displayName}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground ml-2">All Ranks</span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>


                    <TabsContent value="applications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Grading Applications</CardTitle>
                                <CardDescription>Review and manage student grading applications.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-center">
                                    <div className="relative w-full md:w-1/3">
                                        <input
                                            placeholder="Search student name..."
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={appSearchQuery}
                                            onChange={(e) => setAppSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={fetchApplications}
                                            title="Refresh Applications"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={appStatusFilter === 'all' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setAppStatusFilter('all')}
                                        >
                                            All
                                        </Button>
                                        <Button
                                            variant={appStatusFilter === 'pending' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setAppStatusFilter('pending')}
                                        >
                                            Pending
                                        </Button>
                                        <Button
                                            variant={appStatusFilter === 'approved' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setAppStatusFilter('approved')}
                                        >
                                            Approved
                                        </Button>
                                        <Button
                                            variant={appStatusFilter === 'rejected' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setAppStatusFilter('rejected')}
                                        >
                                            Other
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Dojo</TableHead>
                                            <TableHead>Current Rank</TableHead>
                                            <TableHead>Proposed Rank</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredApplications.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No applications found.</TableCell>
                                            </TableRow>
                                        ) : filteredApplications.map((app) => (
                                            <TableRow key={app.id}>
                                                <TableCell className="font-medium text-xs text-muted-foreground">
                                                    {app.gradingPeriod?.title || 'Unknown'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {(app as any).profile?.firstName} {(app as any).profile?.lastName}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {(app as any).profile?.karateProfile?.dojo || '-'}
                                                </TableCell>
                                                <TableCell>{app.currentRank?.displayName}</TableCell>
                                                <TableCell>{app.proposedRank?.displayName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        app.status === 'Approved' ? 'default' :
                                                            app.status === 'Rejected' ? 'destructive' : 'secondary'
                                                    }>
                                                        {app.status}
                                                    </Badge>
                                                    {app.gradingStatus && (
                                                        <span className={`ml-2 text-xs font-mono ${(app.gradingStatus === 'Pass' ? 'text-green-600' : 'text-red-600')}`}>
                                                            [{app.gradingStatus}]
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {app.status === 'Submitted' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(app.id)}>
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(app.id)}>
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {app.status === 'Approved' && (
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openGradingDialog(app)} title="Record Result">
                                                            <ClipboardList className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <CardTitle>Students Directory</CardTitle>
                                <CardDescription>List of all students under your supervision.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="relative w-full md:w-1/3">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search students..."
                                            className="pl-8"
                                            value={studentSearchQuery}
                                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Select value={studentDojoFilter} onValueChange={(v: any) => setStudentDojoFilter(v)}>
                                            <SelectTrigger className="w-[140px]">
                                                <div className="flex items-center gap-2">
                                                    <Filter className="h-4 w-4" />
                                                    <SelectValue placeholder="Dojo" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Dojos</SelectItem>
                                                <SelectItem value="HQ">HQ</SelectItem>
                                                <SelectItem value="TP">TP</SelectItem>
                                                <SelectItem value="SIT">SIT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" onClick={fetchStudents} title="Refresh List">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead>Dojo</TableHead>
                                            <TableHead>Rank</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.filter(student => {
                                            const search = studentSearchQuery.toLowerCase();
                                            const matchesSearch =
                                                student.firstName.toLowerCase().includes(search) ||
                                                student.lastName.toLowerCase().includes(search) ||
                                                student.email.toLowerCase().includes(search);

                                            const matchesDojo = studentDojoFilter === 'all' || student.dojo === studentDojoFilter;

                                            return matchesSearch && matchesDojo;
                                        }).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                    No students found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            students.filter(student => {
                                                const search = studentSearchQuery.toLowerCase();
                                                const matchesSearch =
                                                    student.firstName.toLowerCase().includes(search) ||
                                                    student.lastName.toLowerCase().includes(search) ||
                                                    student.email.toLowerCase().includes(search);

                                                const matchesDojo = studentDojoFilter === 'all' || student.dojo === studentDojoFilter;

                                                return matchesSearch && matchesDojo;
                                            }).map((student) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                                                    <TableCell>{student.email}</TableCell>
                                                    <TableCell className="text-muted-foreground">{student.mobile || '—'}</TableCell>
                                                    <TableCell>{student.dojo}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: student.rankColor }}></span>
                                                            {student.currentRank}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)} title="Edit Student">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 text-xs text-muted-foreground text-center">
                                    Showing {students.filter(s => {
                                        const search = studentSearchQuery.toLowerCase();
                                        const matchesSearch = s.firstName.toLowerCase().includes(search) || s.lastName.toLowerCase().includes(search) || s.email.toLowerCase().includes(search);
                                        const matchesDojo = studentDojoFilter === 'all' || s.dojo === studentDojoFilter;
                                        return matchesSearch && matchesDojo;
                                    }).length} of {students.length} students
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Grading Dialog */}
            <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Grading Result</DialogTitle>
                        <DialogDescription>
                            Enter the exam result for {(selectedGradingApp as any)?.profile?.firstName}. Passing will verify their rank promotion.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Result</Label>
                            <Select value={gradingDecision} onValueChange={(v: 'Pass' | 'Fail') => setGradingDecision(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pass">Pass</SelectItem>
                                    <SelectItem value="Fail">Fail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={gradingNotes}
                                onChange={(e) => setGradingNotes(e.target.value)}
                                placeholder="Enter exam feedback..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>Cancel</Button>
                        <Button onClick={submitGradingResult} className={gradingDecision === 'Pass' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                            Submit Result
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Create Grading Period Dialog */}
            <Dialog open={createPeriodOpen} onOpenChange={setCreatePeriodOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingPeriodId ? 'Edit Grading Period' : 'New Grading Period'}</DialogTitle>
                        <DialogDescription>{editingPeriodId ? 'Update details for this grading session.' : 'Create a new grading session for students to apply.'}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="gp-title">Title</Label>
                            <input
                                id="gp-title"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={newPeriodData.title}
                                onChange={(e) => setNewPeriodData({ ...newPeriodData, title: e.target.value })}
                                placeholder="e.g. March 2024 Grading"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gp-date">Date</Label>
                            <input
                                id="gp-date"
                                type="datetime-local"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={newPeriodData.gradingDate}
                                onChange={(e) => setNewPeriodData({ ...newPeriodData, gradingDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gp-desc">Description</Label>
                            <Textarea
                                id="gp-desc"
                                value={newPeriodData.description}
                                onChange={(e) => setNewPeriodData({ ...newPeriodData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Allowed Ranks (Who can apply?)</Label>
                            <div className="h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                {ranks.map((rank) => (
                                    <div key={rank.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`rank-${rank.id}`}
                                            checked={newPeriodData.allowedRankIds.includes(rank.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setNewPeriodData({
                                                        ...newPeriodData,
                                                        allowedRankIds: [...newPeriodData.allowedRankIds, rank.id]
                                                    });
                                                } else {
                                                    setNewPeriodData({
                                                        ...newPeriodData,
                                                        allowedRankIds: newPeriodData.allowedRankIds.filter(id => id !== rank.id)
                                                    });
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`rank-${rank.id}`} className="text-sm font-normal cursor-pointer">
                                            {rank.displayName} ({rank.beltColor})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Select ranks that are ELIGIBLE to attempt this grading.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreatePeriodOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePeriod}>{editingPeriodId ? 'Update Period' : 'Create Period'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Student Dialog */}
            <EditStudentDialog
                student={editingStudent}
                open={editStudentOpen}
                onOpenChange={setEditStudentOpen}
                onSuccess={fetchStudents}
            />
        </div>
    );
}
