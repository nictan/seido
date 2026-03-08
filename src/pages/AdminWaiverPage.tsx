import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, FileSignature, AlertCircle } from "lucide-react";

const DEFAULT_WAIVER_TEXT = `HAYASHI-HA SHITORYU KARATE-DO SINGAPORE
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

export default function AdminWaiverPage() {
    const { session, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [waiverText, setWaiverText] = useState('');
    const [waiverVersion, setWaiverVersion] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Track original values to detect changes
    const [originalText, setOriginalText] = useState('');
    const [originalVersion, setOriginalVersion] = useState('');

    useEffect(() => {
        const fetchWaiver = async () => {
            try {
                const res = await fetch('/api/admin/waiver');
                if (res.ok) {
                    const data = await res.json();
                    const text = data.waiver_text || DEFAULT_WAIVER_TEXT;
                    const version = data.waiver_version || '2026-v1';
                    setWaiverText(text);
                    setWaiverVersion(version);
                    setOriginalText(text);
                    setOriginalVersion(version);
                }
            } catch (e) {
                console.error('Failed to fetch waiver config', e);
            } finally {
                setLoading(false);
            }
        };
        fetchWaiver();
    }, []);

    useEffect(() => {
        setHasChanges(waiverText !== originalText || waiverVersion !== originalVersion);
    }, [waiverText, waiverVersion, originalText, originalVersion]);

    const handleSave = async () => {
        if (!waiverVersion.trim() || !waiverText.trim()) {
            toast({ variant: 'destructive', title: 'Required Fields', description: 'Waiver text and version are required.' });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/waiver', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ waiver_text: waiverText, waiver_version: waiverVersion }),
            });
            if (res.ok) {
                setOriginalText(waiverText);
                setOriginalVersion(waiverVersion);
                setHasChanges(false);
                toast({
                    title: 'Waiver Updated',
                    description: 'The membership waiver has been saved. Existing signed users are unaffected unless you reset their waivers.',
                });
            } else {
                const data = await res.json();
                toast({ variant: 'destructive', title: 'Save Failed', description: data.error || 'Unknown error.' });
            }
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Unexpected error saving waiver.' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setWaiverText(DEFAULT_WAIVER_TEXT);
        setWaiverVersion('2026-v1');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

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
            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <FileSignature className="h-6 w-6" />
                                Membership Waiver Settings
                            </h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                Edit the waiver text and version that members sign during onboarding.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving || !hasChanges} className="shrink-0">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-sm text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <strong>Version Management:</strong> When you update the waiver text, bump the version (e.g. <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">2026-v2</code>). To require existing members to re-sign, use the <strong>Reset Waiver</strong> button on the Admin Dashboard for the relevant users.
                    </div>
                </div>

                {/* Version field */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Waiver Version</CardTitle>
                        <CardDescription>
                            Used to track which version a member signed. Increment when making significant changes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={waiverVersion}
                            onChange={(e) => setWaiverVersion(e.target.value)}
                            placeholder="e.g. 2026-v1"
                            className="max-w-xs font-mono"
                        />
                    </CardContent>
                </Card>

                {/* Waiver text editor */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Waiver Text</CardTitle>
                                <CardDescription>
                                    This is the full waiver text members will read and sign.
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs shrink-0">
                                Reset to Default
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="waiver-textarea" className="sr-only">Waiver Text</Label>
                        <Textarea
                            id="waiver-textarea"
                            value={waiverText}
                            onChange={(e) => setWaiverText(e.target.value)}
                            rows={28}
                            className="font-mono text-sm resize-y leading-relaxed"
                            spellCheck
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {waiverText.length.toLocaleString()} characters
                        </p>
                    </CardContent>
                </Card>

                {/* Preview card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Preview</CardTitle>
                        <CardDescription>How the waiver appears to members on the signing page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line font-mono text-muted-foreground">
                            {waiverText}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pb-8">
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
