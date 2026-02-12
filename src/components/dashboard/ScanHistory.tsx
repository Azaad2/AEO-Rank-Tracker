import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface ScanResult {
  prompt: string;
  mentioned: boolean | null;
  cited: boolean | null;
  gemini_mentioned: boolean | null;
  gemini_cited: boolean | null;
  gemini_competitors: string[] | null;
  top_cited_domains: string[] | null;
}

interface LatestScan {
  id: string;
  project_domain: string;
}

export function ScanHistory() {
  const [opportunities, setOpportunities] = useState<ScanResult[]>([]);
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [noScanYet, setNoScanYet] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setNoScanYet(true);
          return;
        }

        // Get latest scan for this user
        const { data: scanData, error: scanError } = await supabase
          .from('scans')
          .select('id, project_domain')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (scanError || !scanData) {
          setNoScanYet(true);
          return;
        }

        setDomain(scanData.project_domain);

        // Get scan results
        const { data: results, error: resultsError } = await supabase
          .from('scan_results')
          .select('prompt, mentioned, cited, gemini_mentioned, gemini_cited, gemini_competitors, top_cited_domains')
          .eq('scan_id', scanData.id);

        if (resultsError) throw resultsError;

        // Filter to missed opportunities
        const missed = (results || []).filter(
          (r) => r.mentioned === false || r.gemini_mentioned === false
        );

        setOpportunities(missed);
      } catch (error) {
        console.error('Error fetching ranking opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (noScanYet) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
            Ranking Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            Run your first scan to discover ranking opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Ranking Opportunities
          </CardTitle>
          <CardDescription className="text-gray-400">
            Based on your latest scan for <span className="text-yellow-400 font-medium">{domain}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-4 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>You're ranking on all scanned prompts. Great job!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-yellow-400" />
          Ranking Opportunities
        </CardTitle>
        <CardDescription className="text-gray-400">
          Based on your latest scan for <span className="text-yellow-400 font-medium">{domain}</span> — {opportunities.length} prompt{opportunities.length !== 1 ? 's' : ''} where you're missing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.map((opp, i) => {
          const competitors = [
            ...(opp.gemini_competitors || []),
            ...(opp.top_cited_domains || []),
          ].filter((v, idx, arr) => arr.indexOf(v) === idx);

          return (
            <div key={i} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-white text-sm font-medium">"{opp.prompt}"</p>
              </div>

              <div className="flex flex-wrap gap-2 ml-6">
                <StatusBadge label="Gemini" positive={opp.gemini_mentioned === true} />
                <StatusBadge label="Perplexity" positive={opp.mentioned === true} />
              </div>

              {competitors.length > 0 && (
                <div className="ml-6 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-gray-500">Competitors here:</span>
                  {competitors.slice(0, 5).map((c) => (
                    <Badge key={c} variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {c}
                    </Badge>
                  ))}
                  {competitors.length > 5 && (
                    <span className="text-xs text-gray-500">+{competitors.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${positive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
      {positive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}
