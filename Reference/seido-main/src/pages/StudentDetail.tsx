import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, IdCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { DOJOS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentProfile extends Profile {
  current_rank?: any;
}

interface GradingHistory {
  id: string;
  grading_id: string;
  result: string;
  decided_at: string;
  grade_after: any;
  certificate_url: string | null;
  remarks: string | null;
  gradings: {
    requested_grade: any;
    requested_rank_id: string | null;
    requested_rank: any;
  };
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

export default function StudentDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [gradingHistory, setGradingHistory] = useState<GradingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get the previous tab from location state, default to "students"
  const previousTab = (location.state as any)?.previousTab || "students";

  useEffect(() => {
    if (!authLoading && (!profile?.is_instructor)) {
      navigate("/instructor");
      return;
    }

    if (userId) {
      fetchStudentDetails();
      fetchGradingHistory();
    }
  }, [userId, authLoading, profile, navigate]);

  const fetchStudentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          current_rank:ranks!profiles_current_rank_id_fkey(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setStudent(data as any as StudentProfile);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('grading_history')
        .select(`
          *,
          gradings!inner(
            requested_grade,
            requested_rank_id,
            requested_rank:ranks!gradings_requested_rank_id_fkey(*)
          )
        `)
        .eq('student_id', userId)
        .order('decided_at', { ascending: false });

      if (error) throw error;
      setGradingHistory(data as GradingHistory[]);
    } catch (error) {
      console.error('Error fetching grading history:', error);
    }
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Student Not Found</h1>
            <Button onClick={() => navigate("/instructor")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Instructor Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/instructor", { state: { activeTab: previousTab } })}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Instructor Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Details</h1>
          <p className="text-muted-foreground">View student profile and grading history</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={student.profile_picture_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {student.first_name[0]}{student.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Student ID</p>
                        <p className="font-medium font-mono text-xs">{student.user_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{student.first_name} {student.last_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{student.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Mobile</p>
                        <p className="font-medium">{student.mobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Dojo</p>
                        <p className="font-medium">{DOJOS[student.dojo as keyof typeof DOJOS]}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {new Date(student.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Current Rank</p>
                        <Badge 
                          variant="outline"
                          className={getBeltColorClasses(student.current_grade?.belt_color || 'White')}
                        >
                          {student.current_rank?.display_name || formatGrade(student.current_grade?.kyu || 10)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {student.remarks && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Remarks</p>
                  <p className="text-sm text-muted-foreground">{student.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          {((student as any).emergency_contact_name || (student as any).emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                    <p className="font-medium">{(student as any).emergency_contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Relationship</p>
                    <p className="font-medium">{(student as any).emergency_contact_relationship || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{(student as any).emergency_contact_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{(student as any).emergency_contact_email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grading History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Grading History</CardTitle>
              <CardDescription>
                Past grading results and progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gradingHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Requested Grade</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Grade After</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead>Certificate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradingHistory.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell>
                            {new Date(history.decided_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={getBeltColorClasses(history.gradings.requested_rank?.belt_color || 'White')}
                            >
                              {history.gradings.requested_rank?.display_name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={history.result === 'Pass' ? 'default' : 'destructive'}>
                              {history.result}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {history.grade_after && (
                              <Badge 
                                variant="outline"
                                className={getBeltColorClasses(history.grade_after.belt_color || 'White')}
                              >
                                {history.grade_after.display_name || formatGrade(history.grade_after.kyu)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {history.remarks ? (
                              <span className="text-sm">{history.remarks}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {history.certificate_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(history.certificate_url!, '_blank')}
                              >
                                View
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No grading history found for this student.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
