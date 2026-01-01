import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Grading } from "@/types/database";
import { BELT_COLORS, DOJOS } from "@/types/database";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Mail, Phone, MapPin, Award, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { EmergencyContactDialog } from "./EmergencyContactDialog";

interface StudentDetailDrawerProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentWithRank {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  date_of_birth: string;
  gender: string;
  dojo: string;
  profile_picture_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_relationship?: string;
  remarks?: string;
  is_instructor: boolean;
  rank_effective_date?: string;
  current_grade?: any;
  current_rank?: any;
}

interface GradingHistoryRecord {
  id: string;
  student_id: string;
  grading_id: string;
  result: 'Pass' | 'Fail' | 'Pending';
  decided_at: string;
  grade_after?: any;
  requested_rank?: any;
}

const formatGrade = (kyu: number): string => {
  if (kyu === 0) return "1 Dan";
  if (kyu < 0) return `${Math.abs(kyu) + 1} Dan`;
  return `${kyu} Kyu`;
};

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

export function StudentDetailDrawer({ studentId, open, onOpenChange }: StudentDetailDrawerProps) {
  const [student, setStudent] = useState<StudentWithRank | null>(null);
  const [gradingHistory, setGradingHistory] = useState<GradingHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId && open) {
      fetchStudentDetails();
    }
  }, [studentId, open]);

  const fetchStudentDetails = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          current_rank:ranks!profiles_current_rank_id_fkey(*)
        `)
        .eq('user_id', studentId)
        .single();

      if (profileError) throw profileError;
      setStudent(profileData as StudentWithRank);

      // Fetch grading history
      const { data: gradingData, error: gradingError } = await supabase
        .from('grading_history')
        .select('*')
        .eq('student_id', studentId)
        .order('decided_at', { ascending: false });

      if (gradingError) throw gradingError;
      setGradingHistory((gradingData || []) as GradingHistoryRecord[]);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student && !loading) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Student Profile</SheetTitle>
          <SheetDescription>
            View detailed information about the student
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : student ? (
          <div className="space-y-6 mt-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.profile_picture_url || undefined} />
                <AvatarFallback className="text-lg">
                  {student.first_name?.[0]}{student.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {student.first_name} {student.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline"
                    className={getBeltColorClasses(student.current_grade?.belt_color || 'White')}
                  >
                    {student.current_rank?.display_name || formatGrade(student.current_grade?.kyu || 10)}
                  </Badge>
                  {student.is_instructor && (
                    <Badge variant="secondary">Instructor</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                {student.mobile && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.mobile}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>DOB: {format(new Date(student.date_of_birth), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{student.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{DOJOS[student.dojo as keyof typeof DOJOS]}</span>
                </div>
                {student.rank_effective_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>Rank Since: {format(new Date(student.rank_effective_date), 'PPP')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(student.emergency_contact_name || student.emergency_contact_phone || student.emergency_contact_email) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {student.emergency_contact_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{student.emergency_contact_name}</span>
                      {student.emergency_contact_relationship && (
                        <Badge variant="outline" className="text-xs">
                          {student.emergency_contact_relationship}
                        </Badge>
                      )}
                    </div>
                  )}
                  {student.emergency_contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.emergency_contact_phone}</span>
                    </div>
                  )}
                  {student.emergency_contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{student.emergency_contact_email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Remarks */}
            {student.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instructor Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{student.remarks}</p>
                </CardContent>
              </Card>
            )}

            {/* Grading History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grading History</CardTitle>
                <CardDescription>
                  Past grading results and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gradingHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No grading history available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {gradingHistory.map((grading) => (
                      <div
                        key={grading.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {format(new Date(grading.decided_at), 'PPP')}
                          </div>
                          {grading.grade_after && (
                            <Badge 
                              variant="outline"
                              className={getBeltColorClasses(grading.grade_after.belt_color)}
                            >
                              {formatGrade(grading.grade_after?.kyu || grading.grade_after?.dan || 10)}
                            </Badge>
                          )}
                        </div>
                        <Badge variant={grading.result === 'Pass' ? 'default' : 'destructive'}>
                          {grading.result}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
