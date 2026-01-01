import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Grading, Profile, GradingPeriod } from "@/types/database";
import { BELT_COLORS, DOJOS } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Calendar, MapPin, User, Plus, Clock, BookOpen } from "lucide-react";
import { EmergencyContactDialog } from "@/components/EmergencyContactDialog";
import { StudentDetailDrawer } from "@/components/StudentDetailDrawer";

interface GradingWithStudent extends Grading {
  student_profile: (Profile & { current_rank?: any }) | null;
  requested_rank: any;
  rank_at_application?: any;
  grade_at_application?: {
    kyu: number | null;
    dan: number | null;
    belt_color: string;
  };
}

interface StudentWithRank {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  dojo: string;
  current_grade: any;
  current_rank_id: string | null;
  current_rank: any;
}

// Helper function to format grade display
const formatGrade = (kyu: number): string => {
  if (kyu === 0) return "1 Dan";
  if (kyu < 0) return `${Math.abs(kyu) + 1} Dan`;
  return `${kyu} Kyu`;
};

// Helper function to get belt color styling
const getBeltColorClasses = (beltColor: string) => {
  switch (beltColor?.toLowerCase()) {
    case 'white':
      return 'bg-gray-50 text-gray-800 border-gray-200';
    case 'orange':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'brown':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'black':
      return 'bg-gray-900 text-white border-gray-700';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
};

export default function InstructorDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState((location.state as any)?.activeTab || "applications");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetailDialogOpen, setStudentDetailDialogOpen] = useState(false);
  const [gradings, setGradings] = useState<GradingWithStudent[]>([]);
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  const [students, setStudents] = useState<StudentWithRank[]>([]);
  const [ranks, setRanks] = useState<any[]>([]);
  const [loadingGradings, setLoadingGradings] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentFilter, setStudentFilter] = useState('');
  const [selectedGrading, setSelectedGrading] = useState<GradingWithStudent | null>(null);
  const [decision, setDecision] = useState<'Pass' | 'Fail' | ''>('');
  const [remarks, setRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGradingPeriod, setSelectedGradingPeriod] = useState<string>('');
  const [filterGradingPeriod, setFilterGradingPeriod] = useState<string>('all');
  
  // Grading period form state
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [periodTitle, setPeriodTitle] = useState('');
  const [periodDescription, setPeriodDescription] = useState('');
  const [periodDate, setPeriodDate] = useState('');
  const [periodTime, setPeriodTime] = useState('');
  const [periodLocation, setPeriodLocation] = useState('');
  const [periodMaxApplications, setPeriodMaxApplications] = useState('999');
  const [showApprovePeriodDialog, setShowApprovePeriodDialog] = useState(false);
  const [selectedPeriodForApproval, setSelectedPeriodForApproval] = useState('');
  const [pendingApprovalGrading, setPendingApprovalGrading] = useState<GradingWithStudent | null>(null);
  
  // Grading Periods edit/delete state
  const [editingPeriod, setEditingPeriod] = useState<GradingPeriod | null>(null);
  const [editPeriodDialogOpen, setEditPeriodDialogOpen] = useState(false);
  const [deletingPeriod, setDeletingPeriod] = useState<GradingPeriod | null>(null);
  const [deletePeriodDialogOpen, setDeletePeriodDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !profile?.is_instructor)) {
      navigate("/");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (profile?.is_instructor) {
      fetchGradings();
      fetchGradingPeriods();
      fetchStudents();
      fetchRanks();
    }
  }, [profile]);

  // Set default grading period when periods are loaded
  useEffect(() => {
    if (gradingPeriods.length > 0 && !selectedGradingPeriod) {
      // Find the closest grading period by date
      const now = new Date();
      const upcomingPeriods = gradingPeriods
        .filter(p => new Date(p.grading_date) >= now)
        .sort((a, b) => new Date(a.grading_date).getTime() - new Date(b.grading_date).getTime());
      
      if (upcomingPeriods.length > 0) {
        setSelectedGradingPeriod(upcomingPeriods[0].id);
      }
    }
  }, [gradingPeriods, selectedGradingPeriod]);

  const fetchGradings = async () => {
    try {
      setLoadingGradings(true);
      
      // Get all gradings with student profile and requested rank data
      const { data: gradingsData, error: gradingsError } = await supabase
        .from('gradings')
        .select(`
          *,
          student_profile:profiles!gradings_student_id_fkey(*),
          requested_rank:ranks!gradings_requested_rank_id_fkey(*),
          rank_at_application:ranks!gradings_rank_at_application_id_fkey(*)
        `)
        .order('submitted_at', { ascending: false });

      if (gradingsError) {
        console.error('Error fetching gradings:', gradingsError);
        toast({
          title: "Error",
          description: "Failed to fetch applications",
          variant: "destructive",
        });
        return;
      }

      setGradings(gradingsData as any as GradingWithStudent[] || []);
    } catch (error) {
      console.error('Error fetching gradings:', error);
      toast({
        title: "Error",
        description: "Failed to load grading applications",
        variant: "destructive",
      });
    } finally {
      setLoadingGradings(false);
    }
  };

  const fetchGradingPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('grading_periods')
        .select('*')
        .order('grading_date', { ascending: true });

      if (error) throw error;
      setGradingPeriods((data || []).map(period => ({
        ...period,
        status: period.status as 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled'
      })));
    } catch (error) {
      console.error('Error fetching grading periods:', error);
      toast({
        title: "Error",
        description: "Failed to load grading periods",
        variant: "destructive",
      });
    } finally {
      setLoadingPeriods(false);
    }
  };

  const createGradingPeriod = async () => {
    if (!periodTitle || !periodDate || !periodTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const gradingDateTime = new Date(`${periodDate}T${periodTime}`);
      
      const { error } = await supabase
        .from('grading_periods')
        .insert({
          title: periodTitle,
          description: periodDescription,
          grading_date: gradingDateTime.toISOString(),
          location: periodLocation,
          max_applications: periodMaxApplications ? parseInt(periodMaxApplications) : 999,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grading period created successfully",
      });

      // Reset form
      setPeriodTitle('');
      setPeriodDescription('');
      setPeriodDate('');
      setPeriodTime('');
      setPeriodLocation('');
      setPeriodMaxApplications('999');
      setShowCreatePeriod(false);
      
      fetchGradingPeriods();
    } catch (error) {
      console.error('Error creating grading period:', error);
      toast({
        title: "Error",
        description: "Failed to create grading period",
        variant: "destructive",
      });
    }
  };

  const updateGradingPeriod = async () => {
    if (!editingPeriod || !periodTitle || !periodDate || !periodTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const gradingDateTime = new Date(`${periodDate}T${periodTime}`);
      
      const { error } = await supabase
        .from('grading_periods')
        .update({
          title: periodTitle,
          description: periodDescription,
          grading_date: gradingDateTime.toISOString(),
          location: periodLocation,
          max_applications: periodMaxApplications ? parseInt(periodMaxApplications) : 999,
        })
        .eq('id', editingPeriod.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grading period updated successfully",
      });

      // Reset form
      setEditingPeriod(null);
      setPeriodTitle('');
      setPeriodDescription('');
      setPeriodDate('');
      setPeriodTime('');
      setPeriodLocation('');
      setPeriodMaxApplications('999');
      setEditPeriodDialogOpen(false);
      
      fetchGradingPeriods();
    } catch (error) {
      console.error('Error updating grading period:', error);
      toast({
        title: "Error",
        description: "Failed to update grading period",
        variant: "destructive",
      });
    }
  };

  const deleteGradingPeriod = async () => {
    if (!deletingPeriod) return;

    try {
      const { error } = await supabase
        .from('grading_periods')
        .delete()
        .eq('id', deletingPeriod.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grading period deleted successfully",
      });

      setDeletingPeriod(null);
      setDeletePeriodDialogOpen(false);
      fetchGradingPeriods();
    } catch (error) {
      console.error('Error deleting grading period:', error);
      toast({
        title: "Error",
        description: "Failed to delete grading period",
        variant: "destructive",
      });
    }
  };

  const handleEditPeriod = (period: GradingPeriod) => {
    setEditingPeriod(period);
    setPeriodTitle(period.title);
    setPeriodDescription(period.description || '');
    
    const gradingDate = new Date(period.grading_date);
    setPeriodDate(gradingDate.toISOString().split('T')[0]);
    setPeriodTime(gradingDate.toTimeString().slice(0, 5));
    setPeriodLocation(period.location || '');
    setPeriodMaxApplications((period.max_applications || 999).toString());
    setEditPeriodDialogOpen(true);
  };

  const getPeriodStatus = (gradingDate: string): string => {
    const now = new Date();
    const grading = new Date(gradingDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const gradingDay = new Date(grading.getFullYear(), grading.getMonth(), grading.getDate());
    
    if (gradingDay < today) return 'Past';
    if (gradingDay.getTime() === today.getTime()) return 'Today';
    return 'Upcoming';
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, user_id, first_name, last_name, email, dojo, current_grade, current_rank_id,
          current_rank:ranks!profiles_current_rank_id_fkey(*)
        `)
        .eq('is_student', true)
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchRanks = async () => {
    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('rank_order');

      if (error) throw error;
      setRanks(data || []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      toast({
        title: "Error",
        description: "Failed to load ranks",
        variant: "destructive",
      });
    }
  };

  const updateStudentRank = async (studentId: string, rankId: string) => {
    try {
      const selectedRank = ranks.find(r => r.id === rankId);
      if (!selectedRank) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          current_rank_id: rankId,
          current_grade: {
            kyu: selectedRank.kyu,
            dan: selectedRank.dan,
            belt_color: selectedRank.belt_color,
            effective_date: new Date().toISOString()
          },
          rank_effective_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student rank updated successfully",
      });

      fetchStudents();
    } catch (error) {
      console.error('Error updating student rank:', error);
      toast({
        title: "Error",
        description: "Failed to update student rank",
        variant: "destructive",
      });
    }
  };

  const assignToPeriod = async (gradingId: string, periodId: string) => {
    try {
      const { error } = await supabase
        .from('gradings')
        .update({ 
          grading_period_id: periodId,
          application_status: 'Approved',
          application_decided_by: user?.id,
          application_decided_at: new Date().toISOString()
        })
        .eq('id', gradingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application approved and assigned to grading period",
      });

      setShowApprovePeriodDialog(false);
      setSelectedPeriodForApproval('');
      setSelectedGrading(null);
      fetchGradings();
    } catch (error) {
      console.error('Error assigning to period:', error);
      toast({
        title: "Error",
        description: "Failed to assign to grading period",
        variant: "destructive",
      });
    }
  };

  const handleApproveWithPeriod = () => {
    if (!pendingApprovalGrading || !selectedPeriodForApproval) {
      toast({
        title: "Error",
        description: "Please select a grading period",
        variant: "destructive",
      });
      return;
    }
    assignToPeriod(pendingApprovalGrading.id, selectedPeriodForApproval);
    setPendingApprovalGrading(null);
  };

  // Function to handle application approval/rejection (step 2)
  const handleApplicationDecision = async (action: 'Approved' | 'Rejected') => {
    if (!selectedGrading) return;

    try {
      const updateData: any = {
        application_status: action,
        application_decided_by: user?.id,
        application_decided_at: new Date().toISOString(),
        application_remarks: action === 'Rejected' ? remarks : ''
      };

      const { error } = await supabase
        .from('gradings')
        .update(updateData)
        .eq('id', selectedGrading.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application ${action.toLowerCase()} successfully`,
      });

      // Reset form and refresh data
      setSelectedGrading(null);
      setRemarks('');
      setNotes('');
      fetchGradings();
    } catch (error) {
      console.error('Error processing application decision:', error);
      toast({
        title: "Error",
        description: "Failed to process application decision",
        variant: "destructive",
      });
    }
  };

  // Function to handle actual grading results (step 3)
  const handleGradingDecision = async () => {
    if (!selectedGrading || !decision) return;

    try {
      // Update grading status
      const { error: gradingError } = await supabase
        .from('gradings')
        .update({
          status: decision,
          decided_by: user?.id,
          decided_at: new Date().toISOString(),
          grading_notes: notes,
          visible_remarks: remarks
        })
        .eq('id', selectedGrading.id);

      if (gradingError) throw gradingError;

      // Add to grading history
      const { error: historyError } = await supabase
        .from('grading_history')
        .insert({
          student_id: selectedGrading.student_id,
          grading_id: selectedGrading.id,
          result: decision,
          remarks,
          notes,
          grade_after: decision === 'Pass' ? selectedGrading.requested_grade : null,
          decided_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      // If passed, update student's current grade and rank
      if (decision === 'Pass' && selectedGrading.requested_rank_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            current_rank_id: selectedGrading.requested_rank_id,
            current_grade: {
              ...selectedGrading.requested_grade,
              effective_date: new Date().toISOString()
            },
            rank_effective_date: new Date().toISOString().split('T')[0]
          })
          .eq('user_id', selectedGrading.student_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          throw profileError;
        }
        
        // Also update the grading record with achieved rank
        const { error: achievedError } = await supabase
          .from('gradings')
          .update({ achieved_rank_id: selectedGrading.requested_rank_id })
          .eq('id', selectedGrading.id);
          
        if (achievedError) {
          console.error('Error updating achieved rank:', achievedError);
          throw achievedError;
        }
        
        console.log('Student rank updated successfully to:', selectedGrading.requested_rank_id);
      }

      toast({
        title: "Success",
        description: `Grading result ${decision.toLowerCase()} recorded successfully`,
      });

      // Reset form and refresh data
      setSelectedGrading(null);
      setDecision('');
      setRemarks('');
      setNotes('');
      fetchGradings();
      fetchStudents(); // Refresh student list to show updated rank
    } catch (error) {
      console.error('Error processing grading decision:', error);
      toast({
        title: "Error",
        description: "Failed to process grading decision",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Pass': return 'default';
      case 'Fail': return 'destructive';
      default: return 'secondary';
    }
  };

  // Application filtering functions
  const getNewApplications = () => {
    return gradings.filter(g => 
      g.application_status === 'Submitted'
    );
  };

  const getAllApplications = () => {
    let filtered = gradings;
    
    // Filter by grading period if selected
    if (filterGradingPeriod && filterGradingPeriod !== 'all') {
      filtered = filtered.filter(g => g.grading_period_id === filterGradingPeriod);
    }
    
    return filtered;
  };

  const getGradingPeriodApplications = () => {
    let filtered = gradings.filter(g => 
      g.application_status === 'Approved' && g.grading_period_id !== null
    );
    
    // Filter by grading period if selected
    if (filterGradingPeriod && filterGradingPeriod !== 'all') {
      filtered = filtered.filter(g => g.grading_period_id === filterGradingPeriod);
    }
    
    return filtered;
  };

  const getSelectedPeriodApplications = () => {
    if (!selectedGradingPeriod) return [];
    return gradings.filter(g => 
      g.grading_period_id === selectedGradingPeriod && g.application_status === 'Approved'
    );
  };

  const getFilteredStudents = () => {
    if (!studentFilter) return students;
    const searchTerm = studentFilter.toLowerCase();
    return students.filter(student => 
      student.id.toLowerCase().includes(searchTerm) ||
      student.user_id.toLowerCase().includes(searchTerm) ||
      student.first_name.toLowerCase().includes(searchTerm) ||
      student.last_name.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm) ||
      (student as any).mobile?.toLowerCase().includes(searchTerm)
    );
  };

  // Application Card Component
  const ApplicationCard = ({ grading, showAssignPeriod }: { grading: any, showAssignPeriod: boolean }) => {
    if (!grading.student_profile) return null;
    
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {grading.student_profile.first_name} {grading.student_profile.last_name}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {DOJOS[grading.student_profile.dojo]}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(grading.submitted_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Badge variant={getStatusColor(grading.status)}>
            {grading.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Grade at Application: </span>
            {grading.rank_at_application?.display_name || 
             (grading.grade_at_application?.kyu ? formatGrade(grading.grade_at_application.kyu) : 'Not Recorded')}
          </div>
          <div>
            <span className="font-medium">Requested Grade: </span>
            {grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedGrading(grading)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Grading Application</DialogTitle>
                <DialogDescription>
                  Assess and make a decision on this grading application
                </DialogDescription>
              </DialogHeader>
              
              {selectedGrading && selectedGrading.student_profile && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <label className="text-sm font-medium">Student</label>
                        <p>{selectedGrading.student_profile.first_name} {selectedGrading.student_profile.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Grade at Application</label>
                        <p>{selectedGrading.rank_at_application?.display_name || 
                           (selectedGrading.grade_at_application?.kyu ? formatGrade(selectedGrading.grade_at_application.kyu) : 'Not Recorded')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Requested Grade</label>
                        <p>{selectedGrading.requested_rank ? selectedGrading.requested_rank.display_name : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Submitted</label>
                        <p>{new Date(selectedGrading.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <EmergencyContactDialog
                      studentName={`${selectedGrading.student_profile.first_name} ${selectedGrading.student_profile.last_name}`}
                      emergencyContact={{
                        name: (selectedGrading.student_profile as any).emergency_contact_name,
                        relationship: (selectedGrading.student_profile as any).emergency_contact_relationship,
                        phone: (selectedGrading.student_profile as any).emergency_contact_phone,
                        email: (selectedGrading.student_profile as any).emergency_contact_email,
                      }}
                    />
                  </div>

                  {selectedGrading.status === 'Pending' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Decision</label>
                        <Select value={decision} onValueChange={(value: 'Pass' | 'Fail') => setDecision(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select decision" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pass">Pass</SelectItem>
                            <SelectItem value="Fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Visible Remarks (shown to student)</label>
                        <Textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter remarks visible to the student..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Internal Notes (instructor only)</label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Enter internal notes for instructors..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleGradingDecision} disabled={!decision}>
                          {decision === 'Pass' ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Pass Student
                            </>
                          ) : decision === 'Fail' ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Fail Student
                            </>
                          ) : (
                            'Select Decision'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedGrading.status !== 'Pending' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium">Decision</label>
                        <p className="text-sm">{selectedGrading.status}</p>
                      </div>
                      {selectedGrading.visible_remarks && (
                        <div>
                          <label className="text-sm font-medium">Remarks</label>
                          <p className="text-sm">{selectedGrading.visible_remarks}</p>
                        </div>
                      )}
                      {selectedGrading.grading_notes && (
                        <div>
                          <label className="text-sm font-medium">Internal Notes</label>
                          <p className="text-sm">{selectedGrading.grading_notes}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Decided At</label>
                        <p className="text-sm">{selectedGrading.decided_at ? new Date(selectedGrading.decided_at).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {showAssignPeriod && grading.status === 'Pending' && (
            <Select onValueChange={(value) => assignToPeriod(grading.id, value)}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Assign to period" />
              </SelectTrigger>
              <SelectContent>
                {gradingPeriods
                  .filter(p => p.status === 'Upcoming')
                  .map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  };

  // Grading Card Component for Grading Mode
  const GradingCard = ({ grading }: { grading: any }) => {
    if (!grading.student_profile) return null;
    
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-medium text-lg">
              {grading.student_profile.first_name} {grading.student_profile.last_name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {DOJOS[grading.student_profile.dojo]} • Applied {new Date(grading.submitted_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Current: {grading.student_profile.current_rank?.display_name || formatGrade(grading.student_profile.current_grade?.kyu || 10)}</p>
            <p className="text-sm text-primary font-medium">Target: {grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link 
            to={`/student/${grading.student_id}`}
            state={{ previousTab: "grading" }}
          >
            <Button variant="outline" size="sm" className="w-full">
              <User className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </Link>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setSelectedGrading(grading)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Grade Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Grade Student</DialogTitle>
                <DialogDescription>
                  Make your grading decision for {grading.student_profile.first_name} {grading.student_profile.last_name}
                </DialogDescription>
              </DialogHeader>
              
              {selectedGrading && selectedGrading.student_profile && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg flex-1">
                      <div>
                        <label className="text-sm font-medium">Student</label>
                        <p>{selectedGrading.student_profile.first_name} {selectedGrading.student_profile.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Grade at Application</label>
                        <p>{selectedGrading.rank_at_application?.display_name || 
                           (selectedGrading.grade_at_application?.kyu ? formatGrade(selectedGrading.grade_at_application.kyu) : 'Not Recorded')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Requested Grade</label>
                        <p className="text-primary font-medium">{selectedGrading.requested_rank ? selectedGrading.requested_rank.display_name : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Submitted</label>
                        <p>{new Date(selectedGrading.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Link 
                      to={`/student/${selectedGrading.student_id}`}
                      state={{ previousTab: "grading" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Decision *</label>
                      <Select value={decision} onValueChange={(value: 'Pass' | 'Fail') => setDecision(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Visible Remarks (shown to student)</label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter remarks visible to the student..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Internal Notes (instructor only)</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter internal notes for instructors..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleGradingDecision} disabled={!decision} className="flex-1">
                        {decision === 'Pass' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pass Student
                          </>
                        ) : decision === 'Fail' ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Fail Student
                          </>
                        ) : (
                          'Select Decision First'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!profile.is_instructor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://hayashiha.sg/seido-instructor', '_blank')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Instructor Guide
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Instructor Dashboard</h1>
          <p className="text-muted-foreground">Manage student grading applications and assessments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="periods">Grading Periods</TabsTrigger>
            <TabsTrigger value="grading">Grading Mode</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Applications</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold text-primary">
                     {gradings.filter(g => g.application_status === 'Submitted').length}
                   </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">In Grading Periods</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold text-primary">
                     {gradings.filter(g => g.application_status === 'Approved' && g.grading_period_id).length}
                   </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {gradings.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {gradings.length > 0 
                      ? Math.round((gradings.filter(g => g.status === 'Pass').length / gradings.filter(g => g.status !== 'Pending').length) * 100) || 0
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="new-applications" className="space-y-4">
              <TabsList>
                <TabsTrigger value="new-applications">New Applications</TabsTrigger>
                <TabsTrigger value="all-applications">All Applications</TabsTrigger>
                <TabsTrigger value="period-applications">Grading Period Applications</TabsTrigger>
              </TabsList>

              {/* New Applications Table */}
              <TabsContent value="new-applications">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>New Applications</CardTitle>
                        <CardDescription>Applications with Pending status OR not assigned to grading periods</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loadingGradings ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="ml-2 text-muted-foreground">Loading applications...</span>
                        </div>
                      ) : getNewApplications().length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No New Applications</h3>
                          <p className="text-sm text-muted-foreground">
                            All applications have been either processed or assigned to grading periods
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {getNewApplications().length} new application{getNewApplications().length !== 1 ? 's' : ''} waiting for review
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              {getNewApplications().length} Pending
                            </Badge>
                          </div>
                          
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-muted/50">
                                   <tr>
                                    <th className="text-left p-4 font-medium">Student</th>
                                    <th className="text-left p-4 font-medium">Details</th>
                                    <th className="text-left p-4 font-medium">Grade at Application</th>
                                    <th className="text-left p-4 font-medium">Grading Towards</th>
                                    <th className="text-left p-4 font-medium">Submitted</th>
                                    <th className="text-left p-4 font-medium">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {getNewApplications().map((grading) => {
                                    if (!grading.student_profile) return null;
                                    
                                    const age = Math.floor((new Date().getTime() - new Date(grading.student_profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                                    
                                    return (
                                      <tr key={grading.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                              <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                              <div className="font-medium">
                                                {grading.student_profile.first_name} {grading.student_profile.last_name}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                {grading.student_profile.email}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <div className="space-y-1">
                                            <div className="text-sm">
                                              <span className="font-medium">{grading.student_profile.gender}</span> • {age} years old
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {DOJOS[grading.student_profile.dojo]}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <Badge variant="outline" className={getBeltColorClasses(grading.grade_at_application?.belt_color || 'white')}>
                                            {grading.rank_at_application?.display_name || 
                                             (grading.grade_at_application?.kyu ? formatGrade(grading.grade_at_application.kyu) : 'Not Recorded')}
                                          </Badge>
                                        </td>
                                        <td className="p-4">
                                          <Badge variant="outline" className={getBeltColorClasses(grading.requested_rank?.belt_color || 'white')}>
                                            {grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}
                                          </Badge>
                                        </td>
                                        <td className="p-4">
                                          <div className="text-sm flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(grading.submitted_at).toLocaleDateString()}
                                          </div>
                                        </td>
                                         <td className="p-4">
                                           <div className="flex gap-2">
                                             
                                              <Dialog open={showApprovePeriodDialog && pendingApprovalGrading?.id === grading.id} onOpenChange={(open) => {
                                                setShowApprovePeriodDialog(open);
                                                if (!open) {
                                                  setPendingApprovalGrading(null);
                                                  setSelectedPeriodForApproval('');
                                                }
                                              }}>
                                                <DialogTrigger asChild>
                                                  <Button 
                                                    size="sm" 
                                                    variant="default"
                                                    onClick={() => {
                                                      setPendingApprovalGrading(grading);
                                                      setShowApprovePeriodDialog(true);
                                                      // Pre-select if only one upcoming period
                                                      const upcomingPeriods = gradingPeriods.filter(p => 
                                                        p.status === 'Upcoming' && new Date(p.grading_date) > new Date()
                                                      );
                                                      if (upcomingPeriods.length === 1) {
                                                        setSelectedPeriodForApproval(upcomingPeriods[0].id);
                                                      } else {
                                                        setSelectedPeriodForApproval('');
                                                      }
                                                    }}
                                                  >
                                                    <CheckCircle className="h-3 w-3" />
                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md bg-background border border-border shadow-lg">
                                                  <DialogHeader>
                                                    <DialogTitle>Approve Application</DialogTitle>
                                                    <DialogDescription>
                                                      Approve {grading.student_profile.first_name} {grading.student_profile.last_name}'s application and assign to a grading period
                                                    </DialogDescription>
                                                  </DialogHeader>
                                                  <div className="space-y-4">
                                                    <div>
                                                      <Label htmlFor="grading-period">Select Grading Period</Label>
                                                      <Select 
                                                        value={selectedPeriodForApproval}
                                                        onValueChange={setSelectedPeriodForApproval}
                                                      >
                                                        <SelectTrigger id="grading-period" className="w-full">
                                                          <SelectValue placeholder="Choose a grading period" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                                                          {gradingPeriods
                                                            .filter(p => p.status === 'Upcoming' && new Date(p.grading_date) > new Date())
                                                            .map(period => (
                                                              <SelectItem key={period.id} value={period.id}>
                                                                <div className="flex flex-col">
                                                                  <span className="font-medium">{period.title}</span>
                                                                  <span className="text-xs text-muted-foreground">
                                                                    {new Date(period.grading_date).toLocaleDateString()} • {period.location}
                                                                  </span>
                                                                </div>
                                                              </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <Button 
                                                      onClick={handleApproveWithPeriod} 
                                                      className="w-full"
                                                      disabled={!selectedPeriodForApproval}
                                                    >
                                                      <CheckCircle className="h-4 w-4 mr-1" />
                                                      Submit Approval
                                                    </Button>
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                             
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => {
                                                      setSelectedGrading(grading);
                                                    }}
                                                  >
                                                    <XCircle className="h-3 w-3" />
                                                  </Button>
                                                </DialogTrigger>
                                               <DialogContent className="max-w-md bg-background border border-border shadow-lg">
                                                 <DialogHeader>
                                                   <DialogTitle>Reject Application</DialogTitle>
                                                   <DialogDescription>
                                                     Reject {grading.student_profile.first_name} {grading.student_profile.last_name}'s grading application
                                                   </DialogDescription>
                                                 </DialogHeader>
                                                 <div className="space-y-4">
                                                   <div>
                                                     <label className="text-sm font-medium">Reason for Rejection</label>
                                                     <Textarea
                                                       value={remarks}
                                                       onChange={(e) => setRemarks(e.target.value)}
                                                       placeholder="Please provide feedback for improvement..."
                                                       rows={3}
                                                       required
                                                     />
                                                   </div>
                                                   <div>
                                                     <label className="text-sm font-medium">Internal Notes (optional)</label>
                                                     <Textarea
                                                       value={notes}
                                                       onChange={(e) => setNotes(e.target.value)}
                                                       placeholder="Internal notes for instructors..."
                                                       rows={2}
                                                     />
                                                   </div>
                                                    <Button 
                                                      onClick={() => handleApplicationDecision('Rejected')} 
                                                      variant="destructive" 
                                                      className="w-full"
                                                      disabled={!remarks.trim()}
                                                    >
                                                      <XCircle className="h-4 w-4 mr-1" />
                                                      Reject Application
                                                    </Button>
                                                 </div>
                                               </DialogContent>
                                             </Dialog>
                                           </div>
                                         </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* All Applications Table */}
              <TabsContent value="all-applications">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>All Applications</CardTitle>
                        <CardDescription>Complete list of grading applications with key details</CardDescription>
                      </div>
                      <div className="w-[200px]">
                        <Label htmlFor="filter-period" className="text-xs mb-1 block">Filter by Grading Period</Label>
                        <Select value={filterGradingPeriod} onValueChange={setFilterGradingPeriod}>
                          <SelectTrigger id="filter-period">
                            <SelectValue placeholder="All periods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Periods</SelectItem>
                            {gradingPeriods.map(period => (
                              <SelectItem key={period.id} value={period.id}>
                                {period.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingGradings ? (
                      <div className="text-center py-4">Loading applications...</div>
                    ) : getAllApplications().length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No applications found
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-3 font-medium">Name</th>
                              <th className="text-left p-3 font-medium">Gender</th>
                              <th className="text-left p-3 font-medium">Age</th>
                              <th className="text-left p-3 font-medium">School</th>
                              <th className="text-left p-3 font-medium">Grade at Application</th>
                              <th className="text-left p-3 font-medium">Grading Towards</th>
                              <th className="text-left p-3 font-medium">Status</th>
                              <th className="text-left p-3 font-medium">Application Status</th>
                              <th className="text-left p-3 font-medium">Submitted</th>
                              <th className="text-left p-3 font-medium">Actions</th>
                            </tr>
                          </thead>
                           <tbody>
                             {getAllApplications().map((grading) => {
                               if (!grading.student_profile) return null;
                              
                              const age = Math.floor((new Date().getTime() - new Date(grading.student_profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                              
                              return (
                                <tr key={grading.id} className="border-b hover:bg-muted/30">
                                  <td className="p-3">
                                    <div className="font-medium">
                                      {grading.student_profile.first_name} {grading.student_profile.last_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {grading.student_profile.email}
                                    </div>
                                  </td>
                                  <td className="p-3">{grading.student_profile.gender}</td>
                                  <td className="p-3">{age}</td>
                                  <td className="p-3">{DOJOS[grading.student_profile.dojo]}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={getBeltColorClasses(grading.grade_at_application?.belt_color || 'white')}>
                                      {grading.rank_at_application?.display_name || 
                                       (grading.grade_at_application?.kyu ? formatGrade(grading.grade_at_application.kyu) : 'Not Recorded')}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={getBeltColorClasses(grading.requested_rank?.belt_color || 'white')}>
                                      {grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <Badge variant={getStatusColor(grading.status)}>
                                      {grading.status}
                                    </Badge>
                                  </td>
                                   <td className="p-3">
                                     <Badge variant={
                                       grading.application_status === 'Submitted' ? 'secondary' :
                                       grading.application_status === 'Approved' ? 'default' : 'destructive'
                                     }>
                                       {grading.application_status}
                                     </Badge>
                                   </td>
                                  <td className="p-3 text-sm">
                                    {new Date(grading.submitted_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                        {grading.application_status === 'Submitted' && (
                                         <div className="flex gap-1">
                                           <Dialog open={showApprovePeriodDialog && selectedGrading?.id === grading.id} onOpenChange={(open) => {
                                             setShowApprovePeriodDialog(open);
                                             if (!open) {
                                               setSelectedGrading(null);
                                               setSelectedPeriodForApproval('');
                                             }
                                           }}>
                                             <DialogTrigger asChild>
                                               <Button 
                                                 size="sm" 
                                                 variant="default"
                                                 onClick={() => {
                                                   setSelectedGrading(grading);
                                                   setShowApprovePeriodDialog(true);
                                                   setSelectedPeriodForApproval('');
                                                 }}
                                               >
                                                 <CheckCircle className="h-3 w-3" />
                                               </Button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-md bg-background border border-border shadow-lg">
                                               <DialogHeader>
                                                 <DialogTitle>Approve Application</DialogTitle>
                                                 <DialogDescription>
                                                   Approve {grading.student_profile.first_name} {grading.student_profile.last_name}'s application and assign to a grading period
                                                 </DialogDescription>
                                               </DialogHeader>
                                               <div className="space-y-4">
                                                 <div>
                                                   <label className="text-sm font-medium">Select Grading Period *</label>
                                                   <Select 
                                                     value={selectedPeriodForApproval} 
                                                     onValueChange={setSelectedPeriodForApproval}
                                                   >
                                                     <SelectTrigger>
                                                       <SelectValue placeholder="Choose a grading period" />
                                                     </SelectTrigger>
                                                     <SelectContent className="bg-background border border-border shadow-lg">
                                                       {gradingPeriods
                                                         .filter(p => p.status === 'Upcoming')
                                                         .map(period => (
                                                           <SelectItem key={period.id} value={period.id}>
                                                             {period.title} - {new Date(period.grading_date).toLocaleDateString()}
                                                           </SelectItem>
                                                         ))}
                                                     </SelectContent>
                                                   </Select>
                                                 </div>
                                                 <Button 
                                                   onClick={handleApproveWithPeriod} 
                                                   variant="default" 
                                                   className="w-full"
                                                   disabled={!selectedPeriodForApproval}
                                                 >
                                                   <CheckCircle className="h-4 w-4 mr-1" />
                                                   Approve & Assign
                                                 </Button>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                          
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <Button 
                                                 size="sm" 
                                                 variant="destructive"
                                                 onClick={() => {
                                                   setSelectedGrading(grading);
                                                   setRemarks('');
                                                 }}
                                               >
                                                <XCircle className="h-3 w-3" />
                                              </Button>
                                            </DialogTrigger>
                                             <DialogContent className="max-w-md bg-background border border-border shadow-lg">
                                               <DialogHeader>
                                                 <DialogTitle>Reject Application</DialogTitle>
                                                 <DialogDescription>
                                                   Reject {grading.student_profile.first_name} {grading.student_profile.last_name}'s application to participate in grading
                                                 </DialogDescription>
                                               </DialogHeader>
                                               <div className="space-y-4">
                                                 <div>
                                                   <label className="text-sm font-medium">Reason for Rejection</label>
                                                   <Textarea
                                                     value={remarks}
                                                     onChange={(e) => setRemarks(e.target.value)}
                                                     placeholder="Please provide reason for rejection..."
                                                     rows={3}
                                                     required
                                                   />
                                                 </div>
                                                 <Button 
                                                   onClick={() => handleApplicationDecision('Rejected')} 
                                                   variant="destructive" 
                                                   className="w-full"
                                                   disabled={!remarks.trim()}
                                                 >
                                                   <XCircle className="h-4 w-4 mr-1" />
                                                   Reject Application
                                                 </Button>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                        </div>
                                      )}
                                      
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setSelectedGrading(grading)}
                                          >
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl bg-background border border-border shadow-lg">
                                          <DialogHeader>
                                            <DialogTitle>Application Details</DialogTitle>
                                            <DialogDescription>
                                              Complete details for this grading application
                                            </DialogDescription>
                                          </DialogHeader>
                                          
                                          {selectedGrading && selectedGrading.student_profile && (
                                            <div className="space-y-4">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <label className="text-sm font-medium">Student</label>
                                                  <p>{selectedGrading.student_profile.first_name} {selectedGrading.student_profile.last_name}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Email</label>
                                                  <p>{selectedGrading.student_profile.email}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Gender</label>
                                                  <p>{selectedGrading.student_profile.gender}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Age</label>
                                                  <p>{Math.floor((new Date().getTime() - new Date(selectedGrading.student_profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">School</label>
                                                  <p>{DOJOS[selectedGrading.student_profile.dojo]}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Current Grade</label>
                                                  <p>{formatGrade(selectedGrading.student_profile.current_grade?.kyu || 10)}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Requested Grade</label>
                                                  <p>{selectedGrading.requested_rank ? selectedGrading.requested_rank.display_name : 'N/A'}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Status</label>
                                                  <p>{selectedGrading.status}</p>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium">Application Status</label>
                                                  <Badge variant={
                                                    selectedGrading.application_status === 'Submitted' ? 'secondary' :
                                                    selectedGrading.application_status === 'Approved' ? 'default' : 'destructive'
                                                  }>
                                                    {selectedGrading.application_status}
                                                  </Badge>
                                                </div>
                                              </div>
                                              
                                              {selectedGrading.visible_remarks && (
                                                <div>
                                                  <label className="text-sm font-medium">Remarks</label>
                                                  <p className="text-sm">{selectedGrading.visible_remarks}</p>
                                                </div>
                                              )}
                                              
                                              {selectedGrading.grading_notes && (
                                                <div>
                                                  <label className="text-sm font-medium">Internal Notes</label>
                                                  <p className="text-sm">{selectedGrading.grading_notes}</p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Applications in Grading Periods */}

              {/* Applications in Grading Periods */}
              <TabsContent value="period-applications">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Grading Period Applications</CardTitle>
                        <CardDescription>Applications approved and assigned to grading periods</CardDescription>
                      </div>
                      <div className="w-[200px]">
                        <Label htmlFor="filter-period-2" className="text-xs mb-1 block">Filter by Grading Period</Label>
                        <Select value={filterGradingPeriod} onValueChange={setFilterGradingPeriod}>
                          <SelectTrigger id="filter-period-2">
                            <SelectValue placeholder="All periods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Periods</SelectItem>
                            {gradingPeriods.map(period => (
                              <SelectItem key={period.id} value={period.id}>
                                {period.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getGradingPeriodApplications().length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No applications assigned to grading periods yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-3 font-medium">Name</th>
                              <th className="text-left p-3 font-medium">Gender</th>
                              <th className="text-left p-3 font-medium">Age</th>
                              <th className="text-left p-3 font-medium">School</th>
                              <th className="text-left p-3 font-medium">Grade at Application</th>
                              <th className="text-left p-3 font-medium">Grading Towards</th>
                              <th className="text-left p-3 font-medium">Grading Period</th>
                              <th className="text-left p-3 font-medium">Submitted</th>
                              <th className="text-left p-3 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getGradingPeriodApplications().map((grading) => {
                              if (!grading.student_profile) return null;
                              
                              const age = Math.floor((new Date().getTime() - new Date(grading.student_profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                              const period = gradingPeriods.find(p => p.id === grading.grading_period_id);
                              
                              return (
                                <tr key={grading.id} className="border-b hover:bg-muted/30">
                                  <td className="p-3">
                                    <div className="font-medium">
                                      {grading.student_profile.first_name} {grading.student_profile.last_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {grading.student_profile.email}
                                    </div>
                                  </td>
                                  <td className="p-3">{grading.student_profile.gender}</td>
                                  <td className="p-3">{age}</td>
                                  <td className="p-3">{DOJOS[grading.student_profile.dojo]}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={getBeltColorClasses(grading.grade_at_application?.belt_color || 'white')}>
                                      {grading.rank_at_application?.display_name || 
                                       (grading.grade_at_application?.kyu ? formatGrade(grading.grade_at_application.kyu) : 'Not Recorded')}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={getBeltColorClasses(grading.requested_rank?.belt_color || 'white')}>
                                      {grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm">
                                      {period?.title || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {period ? new Date(period.grading_date).toLocaleDateString() : ''}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {new Date(grading.submitted_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          <Eye className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle>Application Details</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <label className="font-medium">Student</label>
                                              <p>{grading.student_profile.first_name} {grading.student_profile.last_name}</p>
                                            </div>
                                            <div>
                                              <label className="font-medium">Grade at Application</label>
                                              <p>{grading.rank_at_application?.display_name || 
                                                 (grading.grade_at_application?.kyu ? formatGrade(grading.grade_at_application.kyu) : 'Not Recorded')}</p>
                                            </div>
                                            <div>
                                              <label className="font-medium">Requested Grade</label>
                                              <p>{grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}</p>
                                            </div>
                                            <div>
                                              <label className="font-medium">Grading Period</label>
                                              <p>{period?.title || 'Unknown'}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Grading Mode Tab - Now at top level */}
          <TabsContent value="grading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grading Mode</CardTitle>
                <CardDescription>Review and grade applications for a specific grading period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradingPeriods.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="grading-period">Select Grading Period</Label>
                      <Select 
                        value={selectedGradingPeriod} 
                        onValueChange={setSelectedGradingPeriod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a grading period" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradingPeriods
                            .sort((a, b) => new Date(a.grading_date).getTime() - new Date(b.grading_date).getTime())
                            .map(period => (
                              <SelectItem key={period.id} value={period.id}>
                                {period.title} - {new Date(period.grading_date).toLocaleDateString()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {loadingGradings ? (
                    <div className="text-center py-4">Loading applications...</div>
                  ) : selectedGradingPeriod ? (
                    (() => {
                      const selectedPeriodGradings = getSelectedPeriodApplications().filter(g => g.status === 'Pending');
                      return selectedPeriodGradings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No applications ready for grading in the selected period.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            {selectedPeriodGradings.length} applications ready for grading
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-3 font-medium">Name</th>
                                  <th className="text-left p-3 font-medium">Current Grade</th>
                                  <th className="text-left p-3 font-medium">Grading Towards</th>
                                  <th className="text-left p-3 font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPeriodGradings.map((grading) => {
                                  if (!grading.student_profile) return null;
                                  
                                  return (
                                    <tr key={grading.id} className="border-b hover:bg-muted/30">
                                      <td className="p-3">
                                        <div className="font-medium">
                                          {grading.student_profile.first_name} {grading.student_profile.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {DOJOS[grading.student_profile.dojo]}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <Badge variant="outline" className={getBeltColorClasses(grading.student_profile.current_grade?.belt_color || 'white')}>
                                          {formatGrade(grading.student_profile.current_grade?.kyu || 10)}
                                        </Badge>
                                      </td>
                                      <td className="p-3">
                                        <Badge variant="outline" className={getBeltColorClasses(grading.requested_rank?.belt_color || 'white')}>
                                          {grading.requested_rank ? grading.requested_rank.display_name : 'N/A'}
                                        </Badge>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex gap-2">
                                            <Dialog>
                                              <DialogTrigger asChild>
                                                <Button 
                                                  size="sm" 
                                                  variant="default"
                                                  onClick={() => {
                                                    setSelectedGrading(grading);
                                                    setDecision('Pass');
                                                  }}
                                                >
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Pass
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent className="max-w-md bg-background border border-border shadow-lg">
                                                <DialogHeader>
                                                  <DialogTitle>Pass Student</DialogTitle>
                                                  <DialogDescription>
                                                    Pass {grading.student_profile.first_name} {grading.student_profile.last_name}'s grading
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                  <div>
                                                    <label className="text-sm font-medium">Congratulations Message (optional)</label>
                                                    <Textarea
                                                      value={remarks}
                                                      onChange={(e) => setRemarks(e.target.value)}
                                                      placeholder="Congratulations! Well done..."
                                                      rows={3}
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="text-sm font-medium">Internal Notes (optional)</label>
                                                    <Textarea
                                                      value={notes}
                                                      onChange={(e) => setNotes(e.target.value)}
                                                      placeholder="Internal notes for instructors..."
                                                      rows={2}
                                                    />
                                                  </div>
                                                  <Button onClick={handleGradingDecision} className="w-full">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Confirm Pass
                                                  </Button>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                            
                                            <Dialog>
                                              <DialogTrigger asChild>
                                                <Button 
                                                  size="sm" 
                                                  variant="destructive"
                                                  onClick={() => {
                                                    setSelectedGrading(grading);
                                                    setDecision('Fail');
                                                  }}
                                                >
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                  Fail
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent className="max-w-md bg-background border border-border shadow-lg">
                                                <DialogHeader>
                                                  <DialogTitle>Fail Student</DialogTitle>
                                                  <DialogDescription>
                                                    Fail {grading.student_profile.first_name} {grading.student_profile.last_name}'s grading
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                  <div>
                                                    <label className="text-sm font-medium">Feedback Message</label>
                                                    <Textarea
                                                      value={remarks}
                                                      onChange={(e) => setRemarks(e.target.value)}
                                                      placeholder="Areas for improvement..."
                                                      rows={3}
                                                      required
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="text-sm font-medium">Internal Notes (optional)</label>
                                                    <Textarea
                                                      value={notes}
                                                      onChange={(e) => setNotes(e.target.value)}
                                                      placeholder="Internal notes for instructors..."
                                                      rows={2}
                                                    />
                                                  </div>
                                                  <Button 
                                                    onClick={handleGradingDecision} 
                                                    variant="destructive" 
                                                    className="w-full"
                                                    disabled={!remarks.trim()}
                                                  >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Confirm Fail
                                                  </Button>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {gradingPeriods.length === 0 
                        ? "No grading periods created yet. Create a grading period first."
                        : "Select a grading period to start grading applications."
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="periods" className="space-y-6">
            {/* Create Grading Period */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Grading Periods</CardTitle>
                    <CardDescription>Create and manage grading sessions</CardDescription>
                  </div>
                  <Dialog open={showCreatePeriod} onOpenChange={setShowCreatePeriod}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Create Period
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Grading Period</DialogTitle>
                        <DialogDescription>
                          Set up a new grading session for students
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={periodTitle}
                            onChange={(e) => setPeriodTitle(e.target.value)}
                            placeholder="e.g., March 2025 Kyu Grading"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={periodDescription}
                            onChange={(e) => setPeriodDescription(e.target.value)}
                            placeholder="Additional information about this grading period..."
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="date">Date *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={periodDate}
                              onChange={(e) => setPeriodDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="time">Time *</Label>
                            <Input
                              id="time"
                              type="time"
                              value={periodTime}
                              onChange={(e) => setPeriodTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={periodLocation}
                            onChange={(e) => setPeriodLocation(e.target.value)}
                            placeholder="e.g., Main Dojo, Room A"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxApplications">Max Applications</Label>
                          <Input
                            id="maxApplications"
                            type="number"
                            value={periodMaxApplications}
                            onChange={(e) => setPeriodMaxApplications(e.target.value)}
                            min="1"
                            max="100"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={createGradingPeriod}>Create Period</Button>
                          <Button variant="outline" onClick={() => setShowCreatePeriod(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPeriods ? (
                  <div className="text-center py-4">Loading grading periods...</div>
                ) : gradingPeriods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No grading periods created yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gradingPeriods.map((period) => {
                      const assignedApplications = gradings.filter(g => g.grading_period_id === period.id);
                      const periodStatus = getPeriodStatus(period.grading_date);
                      
                      return (
                        <div key={period.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <h3 className="font-medium">{period.title}</h3>
                              {period.description && (
                                <p className="text-sm text-muted-foreground">{period.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(period.grading_date).toLocaleString()}
                                </div>
                                {period.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {period.location}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {assignedApplications.length}/{period.max_applications || 20} applications
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={periodStatus === 'Past' ? 'secondary' : periodStatus === 'Today' ? 'default' : 'outline'}>
                                {periodStatus}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditPeriod(period)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setDeletingPeriod(period);
                                  setDeletePeriodDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          {assignedApplications.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Assigned Applications:</h4>
                              <div className="grid gap-2">
                                {assignedApplications.map(grading => (
                                  grading.student_profile && (
                                    <div key={grading.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                      <span>{grading.student_profile.first_name} {grading.student_profile.last_name}</span>
                                      <Badge variant={getStatusColor(grading.status)} className="text-xs">
                                        {grading.status}
                                      </Badge>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Edit Period Dialog */}
            <Dialog open={editPeriodDialogOpen} onOpenChange={setEditPeriodDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Grading Period</DialogTitle>
                  <DialogDescription>
                    Update the grading session details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      value={periodTitle}
                      onChange={(e) => setPeriodTitle(e.target.value)}
                      placeholder="e.g., March 2025 Kyu Grading"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={periodDescription}
                      onChange={(e) => setPeriodDescription(e.target.value)}
                      placeholder="Additional information about this grading period..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-date">Date *</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={periodDate}
                        onChange={(e) => setPeriodDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-time">Time *</Label>
                      <Input
                        id="edit-time"
                        type="time"
                        value={periodTime}
                        onChange={(e) => setPeriodTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={periodLocation}
                      onChange={(e) => setPeriodLocation(e.target.value)}
                      placeholder="e.g., Main Dojo, Room A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxApplications">Max Applications</Label>
                    <Input
                      id="edit-maxApplications"
                      type="number"
                      value={periodMaxApplications}
                      onChange={(e) => setPeriodMaxApplications(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateGradingPeriod}>Update Period</Button>
                    <Button variant="outline" onClick={() => setEditPeriodDialogOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Delete Period Dialog */}
            <Dialog open={deletePeriodDialogOpen} onOpenChange={setDeletePeriodDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Grading Period</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{deletingPeriod?.title}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDeletePeriodDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={deleteGradingPeriod}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  View and manage student ranks and grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filter */}
                  <div>
                    <Label htmlFor="student-filter">Search Students</Label>
                    <Input
                      id="student-filter"
                      placeholder="Search by ID, name, email or mobile..."
                      value={studentFilter}
                      onChange={(e) => setStudentFilter(e.target.value)}
                    />
                  </div>

                  {/* Students List */}
                  <div className="space-y-3">
                    {getFilteredStudents().map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.email} • {DOJOS[student.dojo as keyof typeof DOJOS]}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline"
                              className={getBeltColorClasses(student.current_grade?.belt_color || 'White')}
                            >
                              Current: {student.current_rank?.display_name || formatGrade(student.current_grade?.kyu || 10)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                         <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedStudentId(student.user_id);
                              setStudentDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Edit Rank
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Student Rank</DialogTitle>
                                <DialogDescription>
                                  Select a new rank for {student.first_name} {student.last_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Rank</Label>
                                  <div className="p-2 bg-muted rounded">
                                    <Badge 
                                      variant="outline"
                                      className={getBeltColorClasses(student.current_grade?.belt_color || 'White')}
                                    >
                                      {student.current_rank?.display_name || formatGrade(student.current_grade?.kyu || 10)}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>New Rank</Label>
                                  <Select 
                                    value={student.current_rank_id || ''}
                                    onValueChange={(value) => updateStudentRank(student.user_id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select new rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ranks.map((rank) => (
                                        <SelectItem key={rank.id} value={rank.id}>
                                          <div className="flex items-center gap-2">
                                            <Badge 
                                              variant="outline"
                                              className={getBeltColorClasses(rank.belt_color)}
                                            >
                                              {rank.display_name}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                    
                    {getFilteredStudents().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {studentFilter ? 'No students found matching your search.' : 'No students found.'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Student Detail Drawer */}
      <StudentDetailDrawer 
        studentId={selectedStudentId}
        open={studentDetailDialogOpen}
        onOpenChange={setStudentDetailDialogOpen}
      />
    </div>
  );
}