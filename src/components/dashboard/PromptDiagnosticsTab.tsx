import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ResultRow {
  prompt: string;
  mentioned: boolean | null;
  cited: boolean | null;
  gemini_mentioned: boolean | null;
  gemini_cited: boolean | null;
  gemini_competitors: string[] | null;
  perplexity_competitors: string[] | null;
  top_cited_domains: string[] | null;
}

export function PromptDiagnosticsTab() {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [domain, setDomain] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: scans } = await supabase
        .from('scans')
        .select('id, project_domain')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const latest = scans?.[0] as any;
      if (!latest) {
        setLoading(false);
        return;
      }
      setDomain(latest.project_domain);
      const { data: rs } = await supabase
        .from('scan_results')
        .select('prompt, mentioned, cited, gemini_mentioned, gemini_cited, gemini_competitors, perplexity_competitors, top_cited_domains')
        .eq('scan_id', latest.id);
      setResults((rs || []) as any);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center text-gray-400 text-sm">
          No prompt diagnostics yet. Run a scan to see prompt-by-prompt breakdowns.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">
            Prompt-by-prompt diagnostics
            <span className="text-xs text-gray-500 ml-2">{domain} • {results.length} prompts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((r, idx) => {
              const signals = [r.mentioned, r.cited, r.gemini_mentioned, r.gemini_cited];
              const hits = signals.filter(Boolean).length;
              const pct = Math.round((hits / signals.length) * 100);
              const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
              const txt = pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400';
              const competitors = [
                ...(r.gemini_competitors || []),
                ...(r.perplexity_competitors || []),
              ].slice(0, 3);
              return (
                <div key={idx} className="p-4 border border-gray-800 rounded-lg bg-black/30">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-medium text-sm flex-1 text-white">{idx + 1}. {r.prompt}</p>
                    <span className={`text-sm font-bold whitespace-nowrap ${txt}`}>{pct}% visible</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  {competitors.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="font-medium text-gray-200">Competitors here:</span> {competitors.join(', ')}
                    </p>
                  )}
                  {r.top_cited_domains && r.top_cited_domains.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      <span className="font-medium text-gray-300">Citation sources:</span> {r.top_cited_domains.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
