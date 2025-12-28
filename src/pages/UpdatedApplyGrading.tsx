import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DOJOS } from "@/types/database";
import { ArrowLeft, FileText, PenTool } from "lucide-react";
import beltSystemReference from "@/assets/belt-system-reference.png";

type Rank = {
  id: string;
  rank_order: number;
  kyu: number | null;
  dan: number | null;
  belt_color: string;
  stripes: number;
  display_name: string;
};

type GradingConfig = {
  id: string;
  rank_id: string;
  is_available: boolean;
  display_order: number;
  rank: Rank;
};

export default function UpdatedApplyGrading() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableRanks, setAvailableRanks] = useState<GradingConfig[]>([]);
  const [currentRank, setCurrentRank] = useState<Rank | null>(null);
  
  const [formData, setFormData] = useState({
    requestedRankId: "",
    confirmDojo: profile?.dojo || "",
    riskAcknowledged: false,
    signature: "",
  });

  useEffect(() => {
    fetchAvailableRanks();
    fetchCurrentRank();
  }, [profile]);

  const fetchAvailableRanks = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_configurations")
        .select(`
          *,
          rank:ranks(*)
        `)
        .eq("is_available", true)
        .order("display_order");

      if (error) throw error;
      setAvailableRanks(data || []);
    } catch (error) {
      console.error("Error fetching available ranks:", error);
      toast({
        title: "Error",
        description: "Failed to load available ranks.",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentRank = async () => {
    if (!profile?.current_rank_id) return;

    try {
      const { data, error } = await supabase
        .from("ranks")
        .select("*")
        .eq("id", profile.current_rank_id)
        .single();

      if (error) throw error;
      setCurrentRank(data);
    } catch (error) {
      console.error("Error fetching current rank:", error);
    }
  };

  const getValidRanksForUser = () => {
    if (!currentRank) return availableRanks;
    
    // Users can only apply for ranks higher than their current rank
    return availableRanks.filter(config => 
      config.rank.rank_order > currentRank.rank_order
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.requestedRankId) {
        toast({
          title: "Error",
          description: "Please select a grade to apply for.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.confirmDojo) {
        toast({
          title: "Error",
          description: "Please confirm your dojo.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (step === 2 && !formData.riskAcknowledged) {
      toast({
        title: "Error",
        description: "Please acknowledge the risk statement.",
        variant: "destructive",
      });
      return;
    }
    
    setStep(step + 1);
  };

  const handleSubmitApplication = async () => {
    // Check emergency contact completion
    if (!(profile as any)?.emergency_contact_name || 
        !(profile as any)?.emergency_contact_relationship || 
        !(profile as any)?.emergency_contact_phone) {
      toast({
        title: "Emergency Contact Required",
        description: "Please complete your emergency contact information in your profile before submitting a grading application.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.signature.trim()) {
      toast({
        title: "Error",
        description: "Please provide your digital signature.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (!selectedRank) {
        throw new Error("No rank selected");
      }

      const indemnityData = {
        signed_at: new Date().toISOString(),
        signature_text: formData.signature,
        pdf_url: ""
      };

      // Use RPC function to capture current grade at time of application
      const { data: gradingId, error: rpcError } = await supabase
        .rpc('insert_grading_application', {
          p_student_id: profile!.user_id,
          p_requested_rank_id: selectedRank.id,
          p_requested_grade: {
            kyu: selectedRank.kyu,
            dan: selectedRank.dan,
            belt_color: selectedRank.belt_color
          },
          p_indemnity: indemnityData,
        });

      if (rpcError) throw rpcError;
      if (!gradingId) throw new Error('Failed to create grading application');

      toast({
        title: "Success!",
        description: "Your grading application has been submitted successfully.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRank = availableRanks.find(config => config.id === formData.requestedRankId)?.rank;
  const validRanks = getValidRanksForUser();

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Apply for Grading</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className={step >= 1 ? "text-primary" : ""}>Grading Details</span>
            <span>→</span>
            <span className={step >= 2 ? "text-primary" : ""}>Risk Acknowledgement</span>
            <span>→</span>
            <span className={step >= 3 ? "text-primary" : ""}>Digital Signature</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Grading Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Rank Display */}
              {currentRank && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Your Current Rank</Label>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{currentRank.display_name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Effective: {profile?.rank_effective_date || "Not specified"}
                    </span>
                  </div>
                </div>
              )}

              {/* Requested Grade Selection */}
              <div>
                <Label htmlFor="requestedGrade">Select Grade to Apply For *</Label>
                <Select 
                  value={formData.requestedRankId} 
                  onValueChange={(value) => setFormData({...formData, requestedRankId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your target grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {validRanks.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No higher ranks available for application
                      </div>
                    ) : (
                      validRanks.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.rank.display_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validRanks.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You can only apply for ranks higher than your current rank.
                  </p>
                )}
              </div>

              {/* Belt System Reference */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium mb-3 block">Belt System Reference</Label>
                <img 
                  src={beltSystemReference} 
                  alt="Belt System Reference Chart"
                  className="w-full max-w-md mx-auto rounded border"
                />
              </div>

              {/* Dojo Confirmation */}
              <div>
                <Label htmlFor="confirmDojo">Confirm Your Dojo *</Label>
                <Select value={formData.confirmDojo} onValueChange={(value) => setFormData({...formData, confirmDojo: value as any})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your dojo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOJOS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleNextStep} 
                className="w-full"
                disabled={validRanks.length === 0}
              >
                Continue to Risk Acknowledgement
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Risk Acknowledgement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Important Notice
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                  Martial arts training and grading involves physical contact and carries inherent risks of injury. 
                  By participating in this grading, you acknowledge and accept these risks.
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="riskAcknowledged"
                    checked={formData.riskAcknowledged}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, riskAcknowledged: checked as boolean})
                    }
                  />
                  <Label htmlFor="riskAcknowledged" className="text-sm">
                    I acknowledge and accept the risks involved in martial arts grading
                  </Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Continue to Signature
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Digital Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h3 className="font-semibold mb-3">Application Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Rank:</span>
                    <div className="font-medium">{currentRank?.display_name || "Not specified"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Applying For:</span>
                    <div className="font-medium">{selectedRank?.display_name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dojo:</span>
                    <div className="font-medium">{DOJOS[formData.confirmDojo as keyof typeof DOJOS]}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <div className="font-medium">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Digital Signature */}
              <div>
                <Label htmlFor="signature">Your Full Name as Digital Signature *</Label>
                <Input
                  id="signature"
                  value={formData.signature}
                  onChange={(e) => setFormData({...formData, signature: e.target.value})}
                  placeholder="Type your full name here"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  By typing your name, you confirm that all information provided is accurate and agree to the terms.
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmitApplication} 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}