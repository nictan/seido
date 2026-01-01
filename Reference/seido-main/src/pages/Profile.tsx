import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DOJOS } from "@/types/database";
import { ArrowLeft, Save, Award, Calendar, User as UserIcon, Hash, Phone, AlertCircle } from "lucide-react";

const Profile = () => {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
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

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        mobile: profile.mobile || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "Other",
        dojo: profile.dojo || "HQ",
        remarks: profile.remarks || "",
        emergency_contact_name: (profile as any).emergency_contact_name || "",
        emergency_contact_relationship: (profile as any).emergency_contact_relationship || "",
        emergency_contact_phone: (profile as any).emergency_contact_phone || "",
        emergency_contact_email: (profile as any).emergency_contact_email || "",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          mobile: formData.mobile,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender as 'Male' | 'Female' | 'Other',
          dojo: formData.dojo as 'TP' | 'SIT' | 'HQ',
          remarks: formData.remarks,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Refresh profile to show latest data
      await refreshProfile();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
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
    if (!profile) return;

    setIsSavingEmergencyContact(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_relationship: formData.emergency_contact_relationship,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_email: formData.emergency_contact_email,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Refresh profile to show latest data
      await refreshProfile();

      toast({
        title: "Emergency Contact Updated",
        description: "Your emergency contact has been successfully updated.",
      });
      
      setIsEditingEmergencyContact(false);
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
        dojo: profile.dojo,
        remarks: profile.remarks || "",
        emergency_contact_name: (profile as any).emergency_contact_name || "",
        emergency_contact_relationship: (profile as any).emergency_contact_relationship || "",
        emergency_contact_phone: (profile as any).emergency_contact_phone || "",
        emergency_contact_email: (profile as any).emergency_contact_email || "",
      });
    }
    setIsEditing(false);
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
    return null;
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

          {/* Critical Information Card */}
          <Card className="mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Student Information
              </CardTitle>
              <CardDescription>Your critical karate profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                  <Award className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Current Rank</p>
                    <p className="font-semibold">
                      {(profile as any).current_rank?.display_name || 'White Belt (10th Kyu)'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(profile as any).current_rank?.belt_color || 'White'} Belt
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Rank Effective Date</p>
                    <p className="font-semibold">
                      {profile.rank_effective_date 
                        ? new Date(profile.rank_effective_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                  <Hash className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Student ID</p>
                    <p className="font-semibold font-mono">
                      {profile.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border">
                  <UserIcon className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Dojo</p>
                    <p className="font-semibold">{DOJOS[profile.dojo]}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded">{profile.first_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded">{profile.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{profile.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                {isEditing ? (
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{profile.mobile}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded">
                      {new Date(profile.date_of_birth).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
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
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded">{profile.gender}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dojo">Dojo</Label>
                {isEditing ? (
                  <Select value={formData.dojo} onValueChange={(value) => handleInputChange("dojo", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOJOS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{DOJOS[profile.dojo]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                {isEditing ? (
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    placeholder="Any additional notes or comments"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded min-h-[80px]">
                    {profile.remarks || "No remarks"}
                  </p>
                )}
              </div>

              {isEditing && (
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
                <Label htmlFor="emergency_contact_email">Contact Email (Optional)</Label>
                {isEditingEmergencyContact ? (
                  <Input
                    id="emergency_contact_email"
                    type="email"
                    value={formData.emergency_contact_email}
                    onChange={(e) => handleInputChange("emergency_contact_email", e.target.value)}
                    placeholder="Emergency contact email (optional)"
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
        </div>
      </main>
    </div>
  );
};

export default Profile;