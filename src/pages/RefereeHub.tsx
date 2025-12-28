import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';

const features = [
  {
    title: 'Rules Library',
    description: 'Access official WKF competition rules and documents',
    icon: FileText,
    href: '/referee/rules',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    title: 'Study Mode',
    description: 'Learn with flashcards using spaced repetition',
    icon: BookOpen,
    href: '/referee/learn',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    title: 'Mock Exams',
    description: 'Test your knowledge with practice exams',
    icon: GraduationCap,
    href: '/referee/quiz',
    color: 'bg-orange-500/10 text-orange-600',
  },
  {
    title: 'My Progress',
    description: 'Track your learning progress and statistics',
    icon: BarChart3,
    href: '/referee/progress',
    color: 'bg-purple-500/10 text-purple-600',
  },
];

export default function RefereeHub() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Referee Exam Preparation</h1>
          <p className="mt-2 text-muted-foreground">
            Prepare for your WKF referee and coach theory exams with our comprehensive study tools.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.href} to={feature.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.color} mb-2`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Exam Types</CardTitle>
            <CardDescription>Choose from the following WKF examination categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-foreground">Kumite Referee Exam</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  170+ TRUE/FALSE questions covering competition rules, scoring, penalties, and procedures.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-foreground">Kumite Coach Exam</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  110+ questions on coach responsibilities, anti-doping, safe sport, and equipment rules.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-foreground">Kata Referee Exam</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions covering kata scoring criteria, competition format, and judging standards.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold text-foreground">Kata Coach Exam</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions on coaching responsibilities and kata competition rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
