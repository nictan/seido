import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Grading } from "@/types/database";
import { ArrowLeft, Calendar, FileText, Award, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface GradingWithRank extends Grading {
  requested_rank?: any;
}

export default function Results() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [gradings, setGradings] = useState<GradingWithRank[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Pass':
        return <CheckCircle className="h-4 w-4" />;
      case 'Fail':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Pass':
        return 'status-pass';
      case 'Fail':
        return 'status-fail';
      default:
        return 'status-pending';
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Grading Results</h1>
              <p className="text-muted-foreground">View your grading application history</p>
            </div>
          </div>

          {loading ? (
            <Card className="dojo-card">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading your results...</p>
                </div>
              </CardContent>
            </Card>
          ) : gradings.length === 0 ? (
            <Card className="dojo-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't submitted any grading applications. Ready to take the next step?
                </p>
                <Button onClick={() => navigate("/apply-grading")}>
                  Apply for Grading
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {gradings.map((grading) => (
                <Card key={grading.id} className="dojo-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          {(grading as any).requested_rank?.display_name || "Grade Application"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          Applied on {format(new Date(grading.submitted_at), 'PPP')}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(grading.status)} flex items-center gap-1`}>
                        {getStatusIcon(grading.status)}
                        {grading.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {grading.status === 'Pending' && (
                        <div className="p-3 bg-accent rounded-lg">
                          <p className="text-sm">
                            <strong>Status:</strong> Your application is being reviewed by instructors. 
                            You will receive notification once a decision is made.
                          </p>
                        </div>
                      )}
                      
                      {grading.status === 'Pass' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Congratulations!</strong> You have successfully passed this grading.
                          </p>
                          {grading.visible_remarks && (
                            <p className="text-sm text-green-700 mt-2">
                              <strong>Instructor Comments:</strong> {grading.visible_remarks}
                            </p>
                          )}
                          {grading.certificate_url && (
                            <Button size="sm" className="mt-3" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Download Certificate
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {grading.status === 'Fail' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Not successful this time.</strong> Please continue training and try again when ready.
                          </p>
                          {grading.visible_remarks && (
                            <p className="text-sm text-red-700 mt-2">
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
                  </CardContent>
                </Card>
              ))}
              
              <div className="text-center pt-6">
                <Button onClick={() => navigate("/apply-grading")} variant="outline">
                  Apply for Another Grading
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}