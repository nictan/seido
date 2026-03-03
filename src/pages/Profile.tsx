import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DOJOS } from "@/types/database";
import { ArrowLeft, Save, User as UserIcon, Phone, AlertCircle } from "lucide-react";

import { MembershipCard } from "@/components/profile/MembershipCard";

const Profile = () => {
    const { profile, loading, createProfile, updateProfile, user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingEmergencyContact, setIsEditingEmergencyContact] = useState(false);
    const [isSavingEmergencyContact, setIsSavingEmergencyContact] = useState(false);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        date_of_birth: "",
        gender: "Other",
        dojo: "HQ",
        remarks: "",
        emergency_contact_name: "",
        emergency_contact_relationship: "",
        emergency_contact_phone: "",
        emergency_contact_email: "",
    });

    // Refresh profile on mount to ensure latest rank/data
    useEffect(() => {
        refreshProfile();
    }, []);

    // Update form data when profile or user changes
    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                email: profile.email || "",
                mobile: profile.mobile || "",
                date_of_birth: profile.date_of_birth || "",
                gender: profile.gender || "Other",
                dojo: profile.karate_profile?.dojo || "HQ",
                remarks: profile.remarks || "",
                emergency_contact_name: profile.emergency_contact_name || "",
                emergency_contact_relationship: profile.emergency_contact_relationship || "",
                emergency_contact_phone: profile.emergency_contact_phone || "",
                emergency_contact_email: profile.emergency_contact_email || "",
            });
        } else if (user) {
            // Auto-fill from user object if profile is missing
            const nameParts = user.name ? user.name.split(" ") : ["", ""];
            const lastName = nameParts.length > 1 ? nameParts.pop() : "";
            const firstName = nameParts.join(" ");

            setFormData(prev => ({
                ...prev,
                first_name: firstName || prev.first_name,
                last_name: lastName || prev.last_name,
                email: user.email || prev.email,
            }));
        }
    }, [profile, user]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { dojo, ...rest } = formData;
            const updates = {
                ...rest,
                karateProfile: { dojo }
            };
            const { error } = await updateProfile(updates);
            if (error) {
                toast({
                    title: "Error",
                    description: error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Profile Updated",
                    description: "Your profile has been successfully updated.",
                });
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEmergencyContact = async () => {
        setIsSavingEmergencyContact(true);
        try {
            const { error } = await updateProfile({
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact_relationship: formData.emergency_contact_relationship,
                emergency_contact_phone: formData.emergency_contact_phone,
                emergency_contact_email: formData.emergency_contact_email,
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Emergency Contact Updated",
                    description: "Your emergency contact has been successfully updated.",
                });
                setIsEditingEmergencyContact(false);
            }
        } catch (error) {
            console.error('Error updating emergency contact:', error);
            toast({
                title: "Error",
                description: "Failed to update emergency contact. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSavingEmergencyContact(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                mobile: profile.mobile,
                date_of_birth: profile.date_of_birth,
                gender: profile.gender,
                dojo: profile.karate_profile?.dojo || "HQ",
                remarks: profile.remarks || "",
                emergency_contact_name: (profile as any).emergency_contact_name || "",
                emergency_contact_relationship: (profile as any).emergency_contact_relationship || "",
                emergency_contact_phone: (profile as any).emergency_contact_phone || "",
                emergency_contact_email: (profile as any).emergency_contact_email || "",
            });
        }
        setIsEditing(false);
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        console.log('Profile UI: Submitting createProfile with formData:', formData);
        try {
            const { error } = await createProfile(formData);
            if (error) {
                toast({
                    title: "Creation Failed",
                    description: error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Profile Created",
                    description: "Welcome to Seido! Your profile has been set up.",
                });

                // Force onboarding flow completed, navigate to dashboard
                // If they just created their profile (forced onboarding flow), navigate them to dashboard
                const state = location.state as any;
                const from = state?.from?.pathname || "/";
                navigate(from, { replace: true });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReassign = async (newUserId: string) => {
        if (!window.confirm(`Are you sure you want to reassign this profile to user ID: ${newUserId}? You will lose access to it if you are not an admin.`)) return;

        setIsSaving(true);
        try {
            const { error } = await updateProfile({ user_id: newUserId });
            if (error) {
                toast({ title: "Reassignment Failed", description: error, variant: "destructive" });
            } else {
                toast({ title: "Profile Reassigned", description: "The profile has been successfully moved to the new user." });
                navigate("/");
            }
        } catch (error) {
            toast({ title: "Error", description: "Reassignment failed", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Loading...</h2>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <UserIcon className="w-12 h-12 mx-auto text-primary" />
                            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
                            <p className="text-muted-foreground">We couldn't find a profile for you. Let's get you set up!</p>
                        </div>
                        <Card>
                            <form onSubmit={handleCreateProfile} className="space-y-4">
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="create-fn">First Name *</Label>
                                            <Input id="create-fn" value={formData.first_name} onChange={e => handleInputChange("first_name", e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="create-ln">Last Name *</Label>
                                            <Input id="create-ln" value={formData.last_name} onChange={e => handleInputChange("last_name", e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-email">Email *</Label>
                                        <Input id="create-email" type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="create-dob">Date of Birth *</Label>
                                            <Input id="create-dob" type="date" value={formData.date_of_birth} onChange={e => handleInputChange("date_of_birth", e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="create-gender">Gender *</Label>
                                            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)} required>
                                                <SelectTrigger id="create-gender">
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-mobile">Mobile *</Label>
                                        <Input id="create-mobile" type="tel" value={formData.mobile} onChange={e => handleInputChange("mobile", e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-remarks">Remarks</Label>
                                        <Textarea id="create-remarks" value={formData.remarks} onChange={e => handleInputChange("remarks", e.target.value)} placeholder="Any additional notes or previous martial arts experience" rows={2} />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold mb-3">Emergency Contact</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="create-ec-name">Contact Name *</Label>
                                                <Input id="create-ec-name" value={formData.emergency_contact_name} onChange={e => handleInputChange("emergency_contact_name", e.target.value)} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-ec-rel">Relationship *</Label>
                                                    <Input id="create-ec-rel" value={formData.emergency_contact_relationship} onChange={e => handleInputChange("emergency_contact_relationship", e.target.value)} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-ec-phone">Contact Phone *</Label>
                                                    <Input id="create-ec-phone" type="tel" value={formData.emergency_contact_phone} onChange={e => handleInputChange("emergency_contact_phone", e.target.value)} required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="create-ec-email">Contact Email</Label>
                                                <Input id="create-ec-email" type="email" value={formData.emergency_contact_email} onChange={e => handleInputChange("emergency_contact_email", e.target.value)} placeholder="Optional" />
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isSaving}>
                                        {isSaving ? "Creating..." : "Create Profile"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </main >
            </div >
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-2xl font-bold">My Profile</h1>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>
                                        {isEditing ? "Edit your personal information" : "View and manage your personal information"}
                                    </CardDescription>
                                </div>
                                {!isEditing && (
                                    <Button onClick={() => setIsEditing(true)}>
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!isEditing ? (
                                <div className="py-2 space-y-6">
                                    <MembershipCard profile={profile} />

                                    {profile.remarks && (
                                        <div className="text-sm pt-2">
                                            <span className="text-muted-foreground font-medium block mb-1">Remarks:</span>
                                            <p className="p-3 bg-muted/50 rounded-md border text-muted-foreground">{profile.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name</Label>
                                            <Input
                                                id="first_name"
                                                value={formData.first_name}
                                                onChange={(e) => handleInputChange("first_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                value={formData.last_name}
                                                onChange={(e) => handleInputChange("last_name", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">Mobile</Label>
                                        <Input
                                            id="mobile"
                                            type="tel"
                                            value={formData.mobile}
                                            onChange={(e) => handleInputChange("mobile", e.target.value)}
                                        />
                                    </div>


                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dojo">Dojo</Label>
                                        <Select
                                            value={formData.dojo}
                                            onValueChange={(value) => handleInputChange("dojo", value)}
                                            disabled={!profile?.is_admin && !profile?.is_instructor}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(DOJOS).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="remarks">Remarks</Label>
                                            <Textarea
                                                id="remarks"
                                                value={formData.remarks}
                                                onChange={(e) => handleInputChange("remarks", e.target.value)}
                                                placeholder="Any additional notes or comments"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSaving ? "Saving..." : "Save Changes"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancel}
                                                disabled={isSaving}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Emergency Contact Card */}
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="w-5 h-5" />
                                        Emergency Contact
                                    </CardTitle>
                                    <CardDescription>
                                        {isEditingEmergencyContact ? "Edit your emergency contact information" : "Required for grading applications"}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!formData.emergency_contact_name || !formData.emergency_contact_relationship || !formData.emergency_contact_phone ? (
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Incomplete
                                        </Badge>
                                    ) : (
                                        <Badge variant="default" className="bg-green-600">Complete</Badge>
                                    )}
                                    {!isEditingEmergencyContact && (
                                        <Button onClick={() => setIsEditingEmergencyContact(true)} size="sm">
                                            Edit Emergency Contact
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>Important:</strong> You must complete all emergency contact information before you can submit a grading application.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                                {isEditingEmergencyContact ? (
                                    <Input
                                        id="emergency_contact_name"
                                        value={formData.emergency_contact_name}
                                        onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                                        placeholder="Full name of emergency contact"
                                    />
                                ) : (
                                    <p className="text-sm p-2 bg-muted rounded">
                                        {formData.emergency_contact_name || "Not provided"}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_relationship">Relationship *</Label>
                                {isEditingEmergencyContact ? (
                                    <Input
                                        id="emergency_contact_relationship"
                                        value={formData.emergency_contact_relationship}
                                        onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                                        placeholder="e.g., Parent, Spouse, Sibling"
                                    />
                                ) : (
                                    <p className="text-sm p-2 bg-muted rounded">
                                        {formData.emergency_contact_relationship || "Not provided"}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                                {isEditingEmergencyContact ? (
                                    <Input
                                        id="emergency_contact_phone"
                                        type="tel"
                                        value={formData.emergency_contact_phone}
                                        onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                                        placeholder="Emergency contact phone number"
                                    />
                                ) : (
                                    <p className="text-sm p-2 bg-muted rounded">
                                        {formData.emergency_contact_phone || "Not provided"}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_email">Contact Email</Label>
                                {isEditingEmergencyContact ? (
                                    <Input
                                        id="emergency_contact_email"
                                        type="email"
                                        value={formData.emergency_contact_email}
                                        onChange={(e) => handleInputChange("emergency_contact_email", e.target.value)}
                                        placeholder="Optional email"
                                    />
                                ) : (
                                    <p className="text-sm p-2 bg-muted rounded">
                                        {formData.emergency_contact_email || "Not provided"}
                                    </p>
                                )}
                            </div>

                            {isEditingEmergencyContact && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSaveEmergencyContact}
                                        disabled={isSavingEmergencyContact}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSavingEmergencyContact ? "Saving..." : "Save Emergency Contact"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                emergency_contact_name: (profile as any).emergency_contact_name || "",
                                                emergency_contact_relationship: (profile as any).emergency_contact_relationship || "",
                                                emergency_contact_phone: (profile as any).emergency_contact_phone || "",
                                                emergency_contact_email: (profile as any).emergency_contact_email || "",
                                            });
                                            setIsEditingEmergencyContact(false);
                                        }}
                                        disabled={isSavingEmergencyContact}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Reassignment Section */}
                    {profile.is_admin && (
                        <Card className="mt-6 border-destructive/20 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="text-destructive flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Admin: Reassign Profile
                                </CardTitle>
                                <CardDescription>Move this profile to a different User ID.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reassign-userid">New User ID (External Auth ID)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="reassign-userid"
                                            placeholder="Enter destination user ID"
                                            defaultValue=""
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleReassign((e.target as HTMLInputElement).value);
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="destructive"
                                            onClick={(e) => {
                                                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                                handleReassign(input.value);
                                            }}
                                        >
                                            Reassign
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Warning: This action cannot be undone easily. Make sure the User ID is correct.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main >
        </div >
    );
};

export default Profile;
