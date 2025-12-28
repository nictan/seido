import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { RefereeRuleDocument, RULE_CATEGORY_LABELS, RuleCategory } from '@/types/referee';

export default function RefereeRules() {
  const [documents, setDocuments] = useState<RefereeRuleDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('referee_rule_documents')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDocuments(data as RefereeRuleDocument[] || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: RuleCategory) => {
    const colors: Record<RuleCategory, string> = {
      kumite: 'bg-red-100 text-red-800',
      kata: 'bg-blue-100 text-blue-800',
      para_karate: 'bg-green-100 text-green-800',
      ranking: 'bg-yellow-100 text-yellow-800',
      protocol: 'bg-purple-100 text-purple-800',
      disciplinary: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Placeholder documents for when database is empty
  const placeholderDocs = [
    { title: 'WKF Kumite Competition Rules 2024', category: 'kumite' as RuleCategory, description: 'Official kumite competition rules and regulations' },
    { title: 'WKF Kata Competition Rules 2024', category: 'kata' as RuleCategory, description: 'Official kata competition rules and scoring criteria' },
    { title: 'WKF Para Karate Rules', category: 'para_karate' as RuleCategory, description: 'Competition rules for para karate athletes' },
    { title: 'WKF World Ranking Rules', category: 'ranking' as RuleCategory, description: 'World ranking calculation and standings rules' },
    { title: 'WKF Protocol Rules', category: 'protocol' as RuleCategory, description: 'Official protocol and ceremony guidelines' },
    { title: 'WKF Disciplinary Code', category: 'disciplinary' as RuleCategory, description: 'Ethics and disciplinary procedures' },
  ];

  const displayDocs = documents.length > 0 ? documents : placeholderDocs.map((doc, i) => ({
    id: `placeholder-${i}`,
    ...doc,
    file_url: undefined,
    version: '2024',
    effective_date: '2024-01-01',
    display_order: i,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/referee" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Referee Hub
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Rules Library</h1>
          <p className="mt-2 text-muted-foreground">
            Official WKF competition rules and documents for reference.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <Badge className={getCategoryColor(doc.category)}>
                      {RULE_CATEGORY_LABELS[doc.category]}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{doc.title}</CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    {doc.version && <span>Version: {doc.version}</span>}
                    {doc.effective_date && (
                      <span>Effective: {new Date(doc.effective_date).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={doc.file_url} download>
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1" disabled>
                        <FileText className="w-4 h-4 mr-1" />
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
