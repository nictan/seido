import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BELT_COLORS, DOJOS } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Grading } from "@/types/database";
import { Calendar, FileText, Award, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import logo from "@/assets/hayashiha-logo.png";

interface GradingWithRank extends Grading {
  requested_rank?: any;
}

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [gradings, setGradings] = useState<GradingWithRank[]>([]);
  const [loadingGradings, setLoadingGradings] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchGradings();
    }
  }, [profile]);

  const fetchGradings = async () => {
    try {
      const { data, error } = await supabase
        .from('gradings')
        .select(`
          *,
          requested_rank:ranks!gradings_requested_rank_id_fkey(*)
        `)
        .eq('student_id', profile?.user_id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setGradings((data || []) as any as GradingWithRank[]);
    } catch (error) {
      console.error('Error fetching gradings:', error);
    } finally {
      setLoadingGradings(false);
    }
  };

  const getDisplayStatus = (grading: GradingWithRank) => {
    // If application is rejected, show that first
    if (grading.application_status === 'Rejected') {
      return { label: 'Application Rejected', icon: <XCircle className="h-4 w-4" />, color: 'status-fail' };
    }
    
    // If application is submitted but not yet approved
    if (grading.application_status === 'Submitted') {
      return { label: 'Under Review', icon: <Clock className="h-4 w-4" />, color: 'status-pending' };
    }
    
    // If approved, show grading status
    if (grading.status === 'Pass') {
      return { label: 'Passed', icon: <CheckCircle className="h-4 w-4" />, color: 'status-pass' };
    }
    
    if (grading.status === 'Fail') {
      return { label: 'Failed', icon: <XCircle className="h-4 w-4" />, color: 'status-fail' };
    }
    
    // Approved but grading pending
    if (grading.application_status === 'Approved') {
      return { label: 'Awaiting Grading', icon: <Clock className="h-4 w-4" />, color: 'status-pending' };
    }
    
    return { label: 'Pending', icon: <Clock className="h-4 w-4" />, color: 'status-pending' };
  };

  // Pagination logic
  const totalPages = Math.ceil(gradings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGradings = gradings.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
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

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Digital Student Card Section */}
        <div className="mb-12">
          <Card className="student-card max-w-2xl mx-auto">
            <div className="student-card-shine" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Logo Section */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-white/95 p-4 shadow-lg flex items-center justify-center">
                    <img src={logo} alt="Hayashi-Ha Karate" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Student Information */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-lg text-white/90 font-medium">
                      {DOJOS[profile.dojo]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-accent/30">
                      <p className="text-lg font-bold text-accent">
                        {(profile as any).current_rank?.display_name || 'White Belt (10th Kyu)'}
                      </p>
                      <p className="text-sm text-white/80">
                        {(profile as any).current_rank?.belt_color || 'White'} Belt
                      </p>
                      {profile.rank_effective_date && (
                        <p className="text-xs text-white/60 mt-2">
                          Since: {new Date(profile.rank_effective_date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-accent/30">
                      <p className="text-xs text-white/70 font-medium mb-1">Student ID</p>
                      <p className="text-lg font-bold font-mono text-accent">
                        {profile.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card Footer with decorative element */}
              <div className="mt-6 pt-4 border-t border-accent/20 flex justify-between items-center text-xs text-white/60">
                <span>Hayashi-Ha Shitoryu Karate-Do</span>
                <span className="font-mono">{new Date().getFullYear()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="dojo-card">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your current information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="text-sm text-muted-foreground">{profile.dojo} Dojo</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate("/profile")}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Grading Results Card */}
          <Card className="dojo-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Grading Results</CardTitle>
                  <CardDescription>Your grading application history</CardDescription>
                </div>
                <Button onClick={() => navigate("/apply-grading")} size="sm">
                  Apply for Grading
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGradings ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading results...</p>
                  </div>
                </div>
              ) : gradings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't submitted any grading applications yet.
                  </p>
                  <Button onClick={() => navigate("/apply-grading")}>
                    Apply for Grading
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-3">
                    {paginatedGradings.map((grading) => {
                      const displayStatus = getDisplayStatus(grading);
                      
                      return (
                        <div key={grading.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="h-4 w-4" />
                                <span className="font-medium text-sm">
                                  {grading.requested_rank?.display_name || "Grade Application"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Applied on {format(new Date(grading.submitted_at), 'PPP')}
                              </div>
                            </div>
                            <Badge className={`${displayStatus.color} flex items-center gap-1 text-xs`}>
                              {displayStatus.icon}
                              {displayStatus.label}
                            </Badge>
                          </div>

                          {grading.application_status === 'Rejected' && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <p className="text-red-800">
                                <strong>Application Not Approved.</strong> Your application to participate in grading was not approved at this time.
                              </p>
                              {grading.application_remarks && (
                                <p className="text-red-700 mt-2">
                                  <strong>Reason:</strong> {grading.application_remarks}
                                </p>
                              )}
                              <p className="text-red-700 mt-2">
                                Please continue your training and speak with your instructor about when to reapply.
                              </p>
                            </div>
                          )}

                          {grading.application_status === 'Submitted' && grading.status === 'Pending' && (
                            <div className="p-2 bg-accent rounded text-xs">
                              <p>
                                <strong>Status:</strong> Your application is being reviewed by instructors. 
                                You will receive notification once a decision is made.
                              </p>
                            </div>
                          )}

                          {grading.application_status === 'Approved' && grading.status === 'Pending' && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <p className="text-blue-800">
                                <strong>Application Approved!</strong> Your application has been approved. 
                                You will be graded in the upcoming grading session.
                              </p>
                            </div>
                          )}
                          
                          {grading.status === 'Pass' && (
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <p className="text-green-800">
                                <strong>Congratulations!</strong> You have successfully passed this grading.
                              </p>
                              {grading.visible_remarks && (
                                <p className="text-green-700 mt-2">
                                  <strong>Instructor Comments:</strong> {grading.visible_remarks}
                                </p>
                              )}
                              {grading.certificate_url && (
                                <Button size="sm" className="mt-2" variant="outline">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Download Certificate
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {grading.status === 'Fail' && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <p className="text-red-800">
                                <strong>Not successful this time.</strong> Please continue training and try again when ready.
                              </p>
                              {grading.visible_remarks && (
                                <p className="text-red-700 mt-2">
                                  <strong>Instructor Feedback:</strong> {grading.visible_remarks}
                                </p>
                              )}
                            </div>
                          )}

                          {grading.decided_at && (
                            <p className="text-xs text-muted-foreground">
                              Decision made on {format(new Date(grading.decided_at), 'PPp')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
