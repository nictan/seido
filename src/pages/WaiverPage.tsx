import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, PenLine, X, RotateCcw } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";

const WAIVER_VERSION = "2026-v1";

const WAIVER_TEXT = `HAYASHI-HA SHITORYU KARATE-DO SINGAPORE
MEMBERSHIP WAIVER & LIABILITY RELEASE FORM

This Activity Waiver and Release of Liability ("Waiver") is entered into as of the date of signing.

1. DETAILS OF ACTIVITY

The Participant will be participating in the following activity: Karate-do (the "Activity") provided by Hayashi-Ha Shitoryu Karate-do Singapore (the "Association").

2. ACKNOWLEDGEMENT OF RISK

The Participant acknowledges that the Activity involves physical exertion and the risk of bodily injury, including but not limited to cuts, bruises, muscle strains, sprains, fractures, and in extreme cases, death. The Participant confirms that they are physically fit and have no known medical conditions that would prevent them from safely participating in the Activity.

3. ASSUMPTION OF RISK

The Participant voluntarily assumes all risks associated with participation in the Activity, whether such risks are known or unknown. The Participant accepts full responsibility for any injuries or damages that may arise from participation.

4. RELEASE OF LIABILITY

In consideration of being permitted to participate in the Activity, the Participant, on behalf of themselves, their heirs, executors, administrators, and assigns, forever releases and discharges the Association, its officers, instructors, employees, agents, and volunteers from any and all claims, actions, damages, liabilities, losses, and expenses arising out of or resulting from participation in the Activity, even if caused by the negligence of the Association.

5. MEDICAL AUTHORISATION

In the event of a medical emergency, the Participant authorises the Association to obtain emergency medical treatment on their behalf. The Participant accepts responsibility for all related medical costs.

6. MEDIA RELEASE

The Participant grants the Association the right to photograph or record them during training sessions and events, and to use such materials for promotional, educational, or record-keeping purposes. The Participant waives any right to compensation for such use.

7. CODE OF CONDUCT

The Participant agrees to abide by the Association's code of conduct, to train safely and responsibly, and to follow all instructions given by authorised instructors and officials.

8. GOVERNING LAW

This Waiver shall be governed by the laws of the Republic of Singapore. Any disputes arising from this Waiver shall be subject to the exclusive jurisdiction of the courts of Singapore.

9. ACKNOWLEDGEMENT

By signing below, the Participant acknowledges that they have read and understood this Waiver in its entirety, that they have had the opportunity to seek independent legal advice, and that they are signing this Waiver voluntarily and of their own free will.`;

export default function WaiverPage() {
    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const sigCanvasRef = useRef<SignatureCanvas>(null);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Dynamic waiver content loaded from site_config
    const [waiverText, setWaiverText] = useState(WAIVER_TEXT);
    const [waiverVersion, setWaiverVersion] = useState(WAIVER_VERSION);
    const [waiverLoading, setWaiverLoading] = useState(true);

    const from = (location.state as any)?.from || "/";

    useEffect(() => {
        fetch('/api/admin/waiver')
            .then(r => r.json())
            .then(data => {
                if (data.waiver_text) setWaiverText(data.waiver_text);
                if (data.waiver_version) setWaiverVersion(data.waiver_version);
            })
            .catch(() => { /* keep defaults */ })
            .finally(() => setWaiverLoading(false));
    }, []);

    const openSignModal = () => setIsSignModalOpen(true);

    const clearSignature = () => {
        sigCanvasRef.current?.clear();
    };

    const confirmSignature = () => {
        if (sigCanvasRef.current?.isEmpty()) {
            toast({
                variant: "destructive",
                title: "Signature Required",
                description: "Please draw your signature before confirming.",
            });
            return;
        }
        const dataUrl = sigCanvasRef.current!.toDataURL("image/png");
        setSignatureDataUrl(dataUrl);
        setIsSignModalOpen(false);
    };

    const generatePdf = useCallback((sigDataUrl: string, profileName: string): string => {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - margin * 2;

        // Header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("HAYASHI-HA SHITORYU KARATE-DO SINGAPORE", pageWidth / 2, margin, { align: "center" });
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Membership Waiver & Liability Release", pageWidth / 2, margin + 7, { align: "center" });

        // Divider
        doc.setDrawColor(180);
        doc.line(margin, margin + 12, pageWidth - margin, margin + 12);

        // Body text
        doc.setFontSize(9);
        let y = margin + 20;
        const lines = doc.splitTextToSize(waiverText, maxWidth);
        for (const line of lines) {
            if (y > 270) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 4.5;
        }

        // Signature area
        if (y > 230) {
            doc.addPage();
            y = margin;
        }
        y += 8;
        doc.setDrawColor(180);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("PARTICIPANT SIGNATURE", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${profileName}`, margin, y);
        y += 5;
        doc.text(`Date: ${new Date().toLocaleDateString("en-SG", { day: "2-digit", month: "long", year: "numeric" })}`, margin, y);
        y += 5;
        doc.text(`Waiver Version: ${waiverVersion}`, margin, y);
        y += 8;

        // Embed signature image
        doc.addImage(sigDataUrl, "PNG", margin, y, 70, 25);

        return doc.output("datauristring");
    }, []);

    const handleSubmit = async () => {
        if (!signatureDataUrl) {
            toast({ variant: "destructive", title: "Signature Required", description: "Please sign before submitting." });
            return;
        }
        setIsSaving(true);
        try {
            const profileName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
            const pdfDataUri = generatePdf(signatureDataUrl, profileName);

            const { error } = await updateProfile({
                waiver_accepted_at: new Date().toISOString(),
                waiver_version: waiverVersion,
                waiver_signature: signatureDataUrl,
                waiver_pdf_data: pdfDataUri,
            });

            if (error) {
                toast({ variant: "destructive", title: "Error Saving Waiver", description: error });
            } else {
                setIsComplete(true);
                toast({ title: "Waiver Signed!", description: "Your membership waiver has been recorded." });
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Unexpected Error", description: err?.message || "Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Loading waiver text ───────────────────────────────────────────────────
    if (waiverLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6">
                    <Card className="max-w-md w-full text-center shadow-lg">
                        <CardContent className="pt-10 pb-10 space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold">Waiver Signed!</h2>
                            <p className="text-muted-foreground">
                                Your membership waiver has been recorded. You now have full access to the Seido portal.
                            </p>
                            <Button className="w-full mt-4" onClick={() => navigate(from, { replace: true })}>
                                Continue to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // ─── Main Waiver Page ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
                {/* Page heading */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Membership Waiver</h1>
                    <p className="text-muted-foreground text-sm">
                        Please read the waiver carefully, then sign below to complete your membership registration.
                    </p>
                </div>

                {/* Waiver text card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Waiver & Liability Release</CardTitle>
                        <CardDescription>
                            Scroll through the full waiver text before signing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line font-mono text-muted-foreground">
                            {waiverText}
                        </div>
                    </CardContent>
                </Card>

                {/* Signature card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <PenLine className="w-4 h-4" />
                            Participant Signature
                        </CardTitle>
                        <CardDescription>
                            Click the box below to open the signature pad and draw your signature.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Participant info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground font-medium">Name: </span>
                                <span className="font-semibold">{profile?.first_name} {profile?.last_name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground font-medium">Date: </span>
                                <span className="font-semibold">
                                    {new Date().toLocaleDateString("en-SG", { day: "2-digit", month: "long", year: "numeric" })}
                                </span>
                            </div>
                        </div>

                        {/* Click-to-sign area */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Signature</p>
                            {signatureDataUrl ? (
                                <div
                                    className="relative border-2 border-green-400 rounded-md bg-white cursor-pointer group"
                                    style={{ height: "100px" }}
                                    onClick={openSignModal}
                                >
                                    <img
                                        src={signatureDataUrl}
                                        alt="Your signature"
                                        className="h-full w-full object-contain p-2"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-md flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground bg-white/90 px-2 py-1 rounded shadow">
                                            Click to re-sign
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openSignModal}
                                    className="w-full border-2 border-dashed border-muted-foreground/40 rounded-md bg-muted/20 
                                               hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer
                                               flex flex-col items-center justify-center gap-2 text-muted-foreground"
                                    style={{ height: "100px" }}
                                >
                                    <PenLine className="w-6 h-6" />
                                    <span className="text-sm font-medium tracking-wide uppercase">Click to Sign</span>
                                </button>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            disabled={!signatureDataUrl || isSaving}
                            onClick={handleSubmit}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            {isSaving ? "Saving..." : "Submit Signed Waiver"}
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => navigate("/")}
                        >
                            Skip for now — I'll sign later
                        </Button>
                    </CardContent>
                </Card>
            </main>

            {/* ─── Signature Modal ─────────────────────────────────────────────── */}
            {isSignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <p className="font-semibold text-sm">Sign Below:</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSignature}
                                    className="gap-1.5 text-xs h-8"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Clear
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={confirmSignature}
                                    className="gap-1.5 text-xs h-8"
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Done
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setIsSignModalOpen(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="p-4 bg-white">
                            <div className="border rounded-md overflow-hidden bg-white relative">
                                <SignatureCanvas
                                    ref={sigCanvasRef}
                                    penColor="#1a1a1a"
                                    canvasProps={{
                                        className: "w-full",
                                        style: { height: "200px", display: "block" },
                                    }}
                                />
                                {/* X placeholder line */}
                                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl text-muted-foreground/40 leading-none select-none">✕</span>
                                        <div className="flex-1 border-b border-muted-foreground/30" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Sign within the box using your mouse or finger
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
