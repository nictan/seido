import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GradingApplication, GradingPeriod, Rank } from '../types/database';
import { Card } from '../components/ui/card';
import { Header } from '../components/layout/Header';


export const MyGrading = () => {
    const { user, profile, session } = useAuth();
    const [applications, setApplications] = useState<GradingApplication[]>([]);
    const [periods, setPeriods] = useState<GradingPeriod[]>([]);
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'applications' | 'history'>('applications');
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState<'active' | 'history'>('active');

    // Derived State
    const currentRankHistory = profile?.rank_histories?.find(h => h.isCurrent);
    // Sort ranks by order (assuming higher order = higher rank? or lower? Usually 10 kyu -> 1 kyu -> 1 dan)
    // Let's check api/ranks.ts. It orders by rankOrder ASC.
    const sortedRanks = [...ranks].sort((a, b) => a.rankOrder - b.rankOrder);

    // Default to the first rank in sortedRanks (lowest rank, e.g. White Belt) if no history found.
    // Safety check: ensure sortedRanks has items before accessing [0]
    const currentRank = currentRankHistory?.rank || (sortedRanks.length > 0 ? sortedRanks[0] : undefined);

    /* console.log('MyGrading Debug:', { 
        ranksLen: ranks.length, 
        sortedLen: sortedRanks.length, 
        currentRank: currentRank?.displayName,
        loading 
    }); */

    let nextRank: Rank | undefined;
    if (currentRank) {
        const currentIndex = sortedRanks.findIndex(r => r.id === currentRank.id);
        if (currentIndex !== -1 && currentIndex < sortedRanks.length - 1) {
            nextRank = sortedRanks[currentIndex + 1];
        }
    }

    const eligiblePeriods = periods.filter(period => {
        // 1. Must be 'Upcoming' status
        if (period.status !== 'Upcoming') return false;

        // 2. Must be in the future (Date check)
        const gradingDate = new Date(period.gradingDate);
        if (gradingDate < new Date()) return false;

        // 3. Rank restrictions
        if (!period.allowedRanks || period.allowedRanks.length === 0) return true; // No restrictions
        if (!currentRank) return false;

        // Check if CURRENT RANK is in allowed list (Who can apply?)
        return period.allowedRanks.some((r: any) => r.rankId === currentRank.id);
    });

    const filteredApplications = applications.filter(app => {
        // 1. Text Search (Period Title)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const periodTitle = app.gradingPeriod?.title?.toLowerCase() || '';
            const rankName = app.proposedRank?.displayName?.toLowerCase() || '';
            if (!periodTitle.includes(query) && !rankName.includes(query)) {
                return false;
            }
        }

        // 2. Status Filter
        if (filterMode === 'active') {
            // "Active" = Submitted OR Approved (but NOT finalized as Pass/Fail)
            if (app.status === 'Rejected' || app.status === 'Withdrawn' || (app.status as any) === 'Void') return false;

            // If Approved, check if it has a result (Pass/Fail)
            if (app.status === 'Approved' && (app.gradingStatus === 'Pass' || app.gradingStatus === 'Fail')) return false;

            // HIDE "Submitted" (Pending) applications if the grading period has passed by > 3 days
            // This prevents old, ignored applications from cluttering the "Active" view.
            if (app.status === 'Submitted' && app.gradingPeriod) {
                const gradingDate = new Date(app.gradingPeriod.gradingDate);
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                // If grading date was before 3 days ago, and it's still just "Submitted", hide it from active.
                if (gradingDate < threeDaysAgo) return false;
            }
        }
        // If filterMode === 'history', show everything (that passed search)

        return true;
    });

    // Form State
    const [selectedPeriodId, setSelectedPeriodId] = useState('');
    const [selectedRankId, setSelectedRankId] = useState('');
    const [instructorNotes, setInstructorNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user && session?.access_token) {
            fetchData();
        }
    }, [user, session?.access_token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [appRes, periodRes, rankRes] = await Promise.all([
                fetch(`/api/grading/applications?userId=${user?.id}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
                fetch('/api/grading/period'),
                fetch('/api/ranks')
            ]);

            if (appRes.ok) setApplications(await appRes.json());
            if (periodRes.ok) setPeriods(await periodRes.json());
            if (rankRes.ok) setRanks(await rankRes.json());
        } catch (error) {
            console.error('Failed to fetch grading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPeriodId || !selectedRankId) return;

        setSubmitting(true);
        try {
            // Determine current rank ID from profile or default
            const currentRankHistory = profile?.rank_histories?.find(h => h.isCurrent);
            const currentRankId = currentRankHistory?.rankId || sortedRanks[0]?.id; // Default to lowest rank (White Belt) if not found

            if (!currentRankId) {
                alert('Could not determine current rank.');
                return;
            }

            const res = await fetch('/api/grading/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    gradingPeriodId: selectedPeriodId,
                    currentRankId: currentRankId,
                    proposedRankId: selectedRankId,
                    instructorNotes
                })
            });

            if (res.ok) {
                setShowApplyModal(false);
                setInstructorNotes('');
                setSelectedPeriodId('');
                setSelectedRankId('');
                fetchData(); // Refresh list
            } else {
                const err = await res.json();
                alert(`Application failed: ${err.error}`);
            }
        } catch (error) {
            console.error('Apply error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickApply = (periodId: string) => {
        if (!nextRank) {
            alert("No next rank available.");
            return;
        }
        setSelectedPeriodId(periodId);
        setSelectedRankId(nextRank.id);
        setShowApplyModal(true);
    }

    const handleWithdraw = async (appId: string) => {
        if (!window.confirm('Are you sure you want to withdraw this application?')) return;

        try {
            const res = await fetch('/api/grading/applications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id: appId, status: 'Withdrawn' })
            });

            if (res.ok) {
                fetchData();
            } else {
                const err = await res.json();
                console.error('Withdraw failed:', err);
                alert(`Failed to withdraw: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Withdraw error:', error);
            alert('An error occurred while withdrawing');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading grading data...</div>;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            My Grading Card
                        </h1>
                        <p className="text-muted-foreground mt-1">Track your progress and apply for grading.</p>
                    </div>
                </div>

                {/* Eligible Grading Periods */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Upcoming Opportunities</h2>
                    {eligiblePeriods.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No upcoming grading periods available for your rank.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {eligiblePeriods.map(period => (
                                <Card key={period.id} className="p-4 border-l-4 border-l-primary flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">{period.title}</h3>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                                {new Date(period.gradingDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">{period.description}</p>
                                    </div>
                                    {(() => {
                                        // Check for existing application for this period
                                        const existingApp = applications.find(a => a.gradingPeriodId === period.id);
                                        const isApplied = existingApp &&
                                            existingApp.status !== 'Withdrawn' &&
                                            existingApp.status !== 'Rejected' &&
                                            (existingApp.status as any) !== 'Void';

                                        return (
                                            <button
                                                onClick={() => handleQuickApply(period.id)}
                                                disabled={!!isApplied}
                                                className={`mt-4 w-full py-2 rounded-md font-medium transition-colors ${isApplied
                                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                    }`}
                                            >
                                                {isApplied ? `Applied (${existingApp.status})` : 'Apply Now'}
                                            </button>
                                        );
                                    })()}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border mb-6">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applications'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('applications')}
                    >
                        My Applications
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => setActiveTab('history')}
                    >
                        My Grades
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'applications' ? (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 p-4 rounded-lg border">
                            <input
                                type="text"
                                placeholder="Search past gradings..."
                                className="w-full sm:max-w-xs flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setFilterMode('active')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterMode === 'active'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setFilterMode('history')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterMode === 'history'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        {filteredApplications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                {searchQuery ? 'No matching applications found.' :
                                    filterMode === 'active' ? 'No active applications. Check history for past results.' :
                                        'No grading applications found.'}
                            </div>
                        ) : (
                            filteredApplications.map((app) => (
                                <Card key={app.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${app.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                app.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    app.status === 'Withdrawn' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {app.status || 'Unknown'}
                                            </span>
                                            {app.gradingStatus && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${app.gradingStatus === 'Pass' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                                    }`}>
                                                    Result: {app.gradingStatus}
                                                </span>
                                            )}
                                            <span className="text-sm text-muted-foreground">
                                                Applied on {new Date(app.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-lg">{app.gradingPeriod?.title || 'Unknown Period'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            For Rank: <span className="font-medium text-foreground">{app.proposedRank?.displayName || 'Unknown Rank'}</span>
                                        </p>
                                        {/* Public instructor feedback — only shown if decided and feedback exists */}
                                        {(app.gradingStatus === 'Pass' || app.gradingStatus === 'Fail') && app.gradingNotes && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">💬 Instructor Feedback</p>
                                                <p className="text-sm text-blue-900">{app.gradingNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                    {app.status === 'Submitted' && (
                                        <button
                                            onClick={() => handleWithdraw(app.id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 hover:bg-red-50 rounded transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Using profile.rank_histories directly */}
                        {!profile?.rank_histories || profile.rank_histories.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                No grading history found.
                            </div>
                        ) : (
                            profile.rank_histories
                                .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
                                .map((hist) => {
                                    const rank = ranks.find(r => r.id === hist.rankId); // Map rank details locally if not populated
                                    return (
                                        <Card key={hist.id} className="p-4 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {rank?.kyu || rank?.dan || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{rank?.displayName || 'Unknown Rank'}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Effective: {new Date(hist.effectiveDate).toLocaleDateString()}
                                                </p>
                                                {hist.isCurrent && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                                        Current Rank
                                                    </span>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })
                        )}
                    </div>
                )}

                {/* Apply Modal */}
                {showApplyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                            <h2 className="text-xl font-bold mb-4">Apply for Grading</h2>
                            <form onSubmit={handleApply} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Grading Period</label>
                                    <select
                                        className="w-full p-2 rounded-md border bg-background"
                                        value={selectedPeriodId}
                                        onChange={(e) => setSelectedPeriodId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a period...</option>
                                        {periods.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.title} ({new Date(p.gradingDate).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Proposed Rank</label>
                                    <select
                                        className="w-full p-2 rounded-md border bg-background"
                                        value={selectedRankId}
                                        onChange={(e) => setSelectedRankId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select rank to attempt...</option>
                                        {ranks.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.displayName} ({r.beltColor})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Message to Instructor (Optional)</label>
                                    <textarea
                                        className="w-full p-2 rounded-md border bg-background"
                                        value={instructorNotes}
                                        onChange={(e) => setInstructorNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Any notes or context you'd like the instructor to know..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowApplyModal(false)}
                                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
