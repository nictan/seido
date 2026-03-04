import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { FileText, Bot, HelpCircle, ClipboardCheck, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { QuizModule } from '../components/referee/QuizModule';
import { TheoryExam } from '../components/referee/TheoryExam';

type Tab = 'documents' | 'buddy' | 'quiz' | 'exam';

const tabs: { id: Tab; label: string; icon: React.ReactNode; available: boolean }[] = [
    { id: 'documents', label: 'Official Documents', icon: <FileText className="h-4 w-4" />, available: true },
    { id: 'buddy', label: 'Study Buddy', icon: <Bot className="h-4 w-4" />, available: false },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="h-4 w-4" />, available: true },
    { id: 'exam', label: 'Theory Exam', icon: <ClipboardCheck className="h-4 w-4" />, available: true },
];

function PlaceholderPanel({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-xs">{description}</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                Coming Soon
            </span>
        </div>
    );
}

export default function RefereePrepHub() {
    const [activeTab, setActiveTab] = useState<Tab>('quiz');

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-4xl mx-auto p-4 md:p-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Referee Prep</h1>
                            <p className="text-muted-foreground text-sm">WKF Referee exam preparation hub</p>
                        </div>
                    </div>
                </div>

                {/* Tab Nav */}
                <div className="flex gap-1 border-b mb-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {!tab.available && (
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Soon</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'documents' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <a href="https://www.wkf.net/files/pdf/documents/WKF%202026%20Kumite%20Competition%20Rules%20MASTER%20COPY_V11.pdf" target="_blank" rel="noopener noreferrer" className="block">
                            <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">WKF Kumite Rules (2026)</CardTitle>
                                            <CardDescription>Competition Rules Master Copy V11</CardDescription>
                                        </div>
                                        <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </CardHeader>
                            </Card>
                        </a>
                        <a href="https://www.wkf.net/files/pdf/documents/WKF%20Kata%20Competition%20Rules%202026%20MASTER%20COPY_V2.pdf" target="_blank" rel="noopener noreferrer" className="block">
                            <Card className="hover:border-primary/50 transition-colors h-full cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">WKF Kata Rules (2026)</CardTitle>
                                            <CardDescription>Competition Rules Master Copy V2</CardDescription>
                                        </div>
                                        <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </CardHeader>
                            </Card>
                        </a>
                    </div>
                )}
                {activeTab === 'buddy' && (
                    <PlaceholderPanel
                        icon={<Bot className="h-6 w-6" />}
                        title="Study Buddy"
                        description="An AI-powered study companion to help you understand rules and scenarios. Coming soon."
                    />
                )}
                {activeTab === 'quiz' && <QuizModule />}
                {activeTab === 'exam' && <TheoryExam />}
            </main>
        </div>
    );
}
