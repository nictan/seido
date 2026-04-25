import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Shield, GraduationCap, Building2, Trash2, Search, Filter, BookOpen, FileSignature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminResetPasswordDialog } from "@/components/admin/AdminResetPasswordDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

type AdminUser = {
    profileId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    dojo: string;
    isAdmin: boolean;
    isInstructor: boolean;
    isStudent: boolean;
    waiverAcceptedAt?: string | null;
};

export default function AdminDashboard() {
    const { session, profile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "instructor" | "student">("all");
    const [dojoFilter, setDojoFilter] = useState<"all" | "HQ" | "TP" | "SIT">("all");

    // Edit User Dialog State
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editFormData, setEditFormData] = useState({
        isAdmin: false,
        isInstructor: false,
        dojo: 'HQ',
        features: { grading: true, referee_prep: false }
    });
    const [reassignUserId, setReassignUserId] = useState('');

    // Site Config State
    const [siteConfig, setSiteConfig] = useState({ default_grading: true, default_referee_prep: false });
    const [savingConfig, setSavingConfig] = useState(false);

    const fetchSiteConfig = async () => {
        try {
            const res = await fetch('/api/admin/features', {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSiteConfig(data);
            }
        } catch (e) { console.error('Failed to fetch site config', e); }
    };

    const saveSiteConfig = async (newConfig: typeof siteConfig) => {
        setSavingConfig(true);
        try {
            const res = await fetch('/api/admin/features', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify(newConfig),
            });
            if (res.ok) {
                toast({ title: 'Saved', description: 'Default feature settings updated.' });
                setSiteConfig(newConfig);
            } else {
                toast({ title: 'Error', description: 'Failed to save config.', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Unexpected error.', variant: 'destructive' });
        } finally { setSavingConfig(false); }
    };

    // Delete Dialog State
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.access_token && profile?.is_admin) {
            fetchUsers();
            fetchSiteConfig();
        } else if (!authLoading && !profile?.is_admin) {
            setLoading(false);
        }
    }, [session, profile, authLoading]);

    const handleEditUser = (user: AdminUser) => {
        setEditingUser(user);
        // Load current features from user row — fall back to site defaults
        setEditFormData({
            isAdmin: user.isAdmin,
            isInstructor: user.isInstructor,
            dojo: user.dojo || 'HQ',
            features: {
                grading: (user as any).features?.grading ?? siteConfig.default_grading,
                referee_prep: (user as any).features?.referee_prep ?? siteConfig.default_referee_prep,
            }
        });
        setEditUserOpen(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    profileId: editingUser.profileId,
                    ...editFormData
                })
            });

            if (res.ok) {
                toast({ title: "Success", description: "User permissions updated." });
                setEditUserOpen(false);
                fetchUsers();
            } else {
                toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        }
    };

    const handleReassignUser = async () => {
        if (!editingUser || !reassignUserId.trim()) return;
        if (!window.confirm(`Reassign ${editingUser.firstName} ${editingUser.lastName}'s profile to user ID: ${reassignUserId}?\n\nThis cannot be easily undone. Make sure the User ID is correct.`)) return;
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ userId: editingUser.userId, newUserId: reassignUserId.trim() })
            });
            if (res.ok) {
                toast({ title: "Profile Reassigned", description: `${editingUser.firstName}'s profile has been moved to the new user.` });
                setEditUserOpen(false);
                setReassignUserId('');
                fetchUsers();
            } else {
                const data = await res.json();
                toast({ title: "Reassignment Failed", description: data.error || "Unknown error.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Unexpected error during reassignment.", variant: "destructive" });
        }
    };

    const confirmDeleteUser = (user: AdminUser) => {
        setUserToDelete(user);
        setDeleteAlertOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    userId: userToDelete.userId,
                    profileId: userToDelete.profileId
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast({ title: "Deleted", description: "User has been permanently removed." });
                setDeleteAlertOpen(false);
                setUserToDelete(null);
                fetchUsers();
            } else {
                toast({ title: "Error", description: data.error || "Failed to delete user.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        }
    };

    const handleResetWaiver = async (user: AdminUser) => {
        if (!window.confirm(`Reset waiver for ${user.firstName} ${user.lastName}? They will need to re-sign the waiver.`)) return;
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    userId: user.userId,
                    waiverAcceptedAt: null,
                    waiverVersion: null,
                    waiverSignature: null,
                    waiverPdfData: null,
                })
            });
            if (res.ok) {
                toast({ title: "Waiver Reset", description: `${user.firstName}'s waiver has been cleared. They will need to re-sign.` });
                fetchUsers();
            } else {
                toast({ title: "Error", description: "Failed to reset waiver.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Unexpected error.", variant: "destructive" });
        }
    };

    // Derived Statistics
    const totalUsers = users.length;
    const totalInstructors = users.filter(u => u.isInstructor).length;
    const activeDojos = Array.from(new Set(users.map(u => u.dojo).filter(Boolean))).length;

    // Filter Logic
    const filteredUsers = users.filter(user => {
        // Search
        const search = searchQuery.toLowerCase();
        const matchesSearch =
            (user.firstName || '').toLowerCase().includes(search) ||
            (user.lastName || '').toLowerCase().includes(search) ||
            (user.email || '').toLowerCase().includes(search);

        // Role Filter
        let matchesRole = true;
        if (roleFilter === 'admin') matchesRole = user.isAdmin;
        if (roleFilter === 'instructor') matchesRole = user.isInstructor;
        if (roleFilter === 'student') matchesRole = user.isStudent;

        // Dojo Filter
        let matchesDojo = true;
        if (dojoFilter !== 'all') matchesDojo = user.dojo === dojoFilter;

        return matchesSearch && matchesRole && matchesDojo;
    });

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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Platform administration and user management.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href="/admin/ranks"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium bg-card hover:bg-muted transition-colors"
                        >
                            <GraduationCap className="h-3.5 w-3.5" />
                            Ranks
                        </a>
                        <a
                            href="/admin/referee"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium bg-card hover:bg-muted transition-colors"
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            Referee Settings
                        </a>
                        <a
                            href="/admin-waiver"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium bg-card hover:bg-muted transition-colors"
                        >
                            <FileSignature className="h-3.5 w-3.5" />
                            Waiver Settings
                        </a>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalInstructors}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Dojos</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeDojos}</div>
                            <p className="text-xs text-muted-foreground">Across {activeDojos} locations</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>Manage user roles, permissions and assignments.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchUsers}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative w-full md:w-1/3">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                                    <SelectTrigger className="w-[140px]">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4" />
                                            <SelectValue placeholder="Role" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="instructor">Instructor</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={dojoFilter} onValueChange={(v: any) => setDojoFilter(v)}>
                                    <SelectTrigger className="w-[140px]">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
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
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Dojo</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead>Waiver</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.profileId}>
                                                <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{user.dojo || '-'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {user.isAdmin && <Badge className="bg-red-600">Admin</Badge>}
                                                        {user.isInstructor && <Badge className="bg-blue-600">Instructor</Badge>}
                                                        {user.isStudent && <Badge variant="secondary">Student</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.waiverAcceptedAt ? (
                                                        <Badge variant="default" className="bg-green-600 text-xs">Signed</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="text-xs">Not Signed</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                                            Edit Roles
                                                        </Button>
                                                        {user.waiverAcceptedAt && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                                onClick={() => handleResetWaiver(user)}
                                                                title="Reset Waiver"
                                                            >
                                                                <FileSignature className="h-4 w-4 mr-1" />
                                                                Reset Waiver
                                                            </Button>
                                                        )}
                                                        <AdminResetPasswordDialog
                                                            studentId={user.userId}
                                                            studentName={`${user.firstName} ${user.lastName}`}
                                                            studentEmail={user.email}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => confirmDeleteUser(user)}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground text-center">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    </CardContent>
                </Card>

                {/* Site Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Site Configuration</CardTitle>
                        <CardDescription>Default features enabled for all new members when they join.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="cfg-grading" className="flex flex-col space-y-1">
                                <span>Grading</span>
                                <span className="font-normal text-sm text-muted-foreground">New members can submit grading applications by default.</span>
                            </Label>
                            <Switch
                                id="cfg-grading"
                                checked={siteConfig.default_grading}
                                onCheckedChange={(c) => {
                                    const next = { ...siteConfig, default_grading: c };
                                    saveSiteConfig(next);
                                }}
                                disabled={savingConfig}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="cfg-referee" className="flex flex-col space-y-1">
                                <span>Referee Prep</span>
                                <span className="font-normal text-sm text-muted-foreground">New members get access to the Referee Study module by default.</span>
                            </Label>
                            <Switch
                                id="cfg-referee"
                                checked={siteConfig.default_referee_prep}
                                onCheckedChange={(c) => {
                                    const next = { ...siteConfig, default_referee_prep: c };
                                    saveSiteConfig(next);
                                }}
                                disabled={savingConfig}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            ⚠ Changes apply to new members only. To change access for existing members, use <strong>Edit Roles</strong> above.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {editingUser?.firstName} {editingUser?.lastName}</DialogTitle>
                        <DialogDescription>Modify permissions and assignments.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        {/* Roles */}
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roles</p>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="is-admin" className="flex flex-col space-y-1">
                                    <span>Administrator</span>
                                    <span className="font-normal text-xs text-muted-foreground">Grants full access to this dashboard.</span>
                                </Label>
                                <Switch
                                    id="is-admin"
                                    checked={editFormData.isAdmin}
                                    onCheckedChange={(c) => setEditFormData({ ...editFormData, isAdmin: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="is-instructor" className="flex flex-col space-y-1">
                                    <span>Instructor</span>
                                    <span className="font-normal text-xs text-muted-foreground">Grants access to the Instructor Dashboard.</span>
                                </Label>
                                <Switch
                                    id="is-instructor"
                                    checked={editFormData.isInstructor}
                                    onCheckedChange={(c) => setEditFormData({ ...editFormData, isInstructor: c })}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Feature Access */}
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature Access</p>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="feat-grading" className="flex flex-col space-y-1">
                                    <span>Grading</span>
                                    <span className="font-normal text-xs text-muted-foreground">Allow student to submit grading applications.</span>
                                </Label>
                                <Switch
                                    id="feat-grading"
                                    checked={editFormData.features.grading}
                                    onCheckedChange={(c) => setEditFormData({ ...editFormData, features: { ...editFormData.features, grading: c } })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="feat-referee" className="flex flex-col space-y-1">
                                    <span>Referee Prep</span>
                                    <span className="font-normal text-xs text-muted-foreground">Allow access to the Referee Study module.</span>
                                </Label>
                                <Switch
                                    id="feat-referee"
                                    checked={editFormData.features.referee_prep}
                                    onCheckedChange={(c) => setEditFormData({ ...editFormData, features: { ...editFormData.features, referee_prep: c } })}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Dojo */}
                        <div className="space-y-2">
                            <Label>Dojo Assignment</Label>
                            <Select
                                value={editFormData.dojo}
                                onValueChange={(v) => setEditFormData({ ...editFormData, dojo: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HQ">Headquarters (HQ)</SelectItem>
                                    <SelectItem value="TP">Temasek Polytechnic (TP)</SelectItem>
                                    <SelectItem value="SIT">Singapore Institute of Technology (SIT)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Danger Zone — Reassign Profile */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Danger Zone</p>
                            <div className="space-y-1">
                                <Label htmlFor="reassign-userid" className="text-sm">Reassign Profile to User ID</Label>
                                <p className="text-xs text-muted-foreground">Move this profile to a different authentication account. This action is difficult to undo.</p>
                                <div className="flex gap-2 pt-1">
                                    <Input
                                        id="reassign-userid"
                                        placeholder="Enter destination auth User ID"
                                        value={reassignUserId}
                                        onChange={(e) => setReassignUserId(e.target.value)}
                                    />
                                    <Button
                                        variant="destructive"
                                        onClick={handleReassignUser}
                                        disabled={!reassignUserId.trim()}
                                    >
                                        Reassign
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            <strong> {userToDelete?.firstName} {userToDelete?.lastName}</strong> and remove their account, profile, grading history, and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Delete User</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
