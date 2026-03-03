import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { FileText, Bot, HelpCircle, ClipboardCheck } from 'lucide-react';
import { QuizModule } from '../components/referee/QuizModule';
import { TheoryExam } from '../components/referee/TheoryExam';

type Tab = 'documents' | 'buddy' | 'quiz' | 'exam';

const tabs: { id: Tab; label: string; icon: React.ReactNode; available: boolean }[] = [
    { id: 'documents', label: 'Official Documents', icon: <FileText className="h-4 w-4" />, available: false },
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

                {/* Tab Content */}
                {activeTab === 'documents' && (
                    <PlaceholderPanel
                        icon={<FileText className="h-6 w-6" />}
                        title="Official WKF Documents"
                        description="WKF Competition Rules, Referee Guidelines, and official documentation will be available here."
                    />
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
