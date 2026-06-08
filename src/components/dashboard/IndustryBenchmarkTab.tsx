import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Award, Target } from 'lucide-react';
import { IndustryBenchmarkStrip } from '@/components/IndustryBenchmarkStrip';

interface LatestScan {
  id: string;
  project_domain: string;
  score: number | null;
  created_at: string;
}

const INDUSTRY_AVG = 34;

export function IndustryBenchmarkTab() {
  const { user } = useAuth();
  const [scan, setScan] = useState<LatestScan | null>(null);
  const [stats, setStats] = useState<{ total: number; missing: number; competitors: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: scans } = await supabase
        .from('scans')
        .select('id, project_domain, score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const latest = scans?.[0] as LatestScan | undefined;
      if (latest) {
        setScan(latest);
        const { data: results } = await supabase
          .from('scan_results')
          .select('mentioned, gemini_mentioned, perplexity_mentioned, gemini_competitors, perplexity_competitors')
          .eq('scan_id', latest.id);
        const total = results?.length ?? 0;
        const missing = (results ?? []).filter(
          (r: any) => !r.mentioned && !r.gemini_mentioned && !r.perplexity_mentioned,
        ).length;
        const compSet = new Set<string>();
        for (const r of results ?? []) {
          for (const c of [...((r as any).gemini_competitors || []), ...((r as any).perplexity_competitors || [])]) {
            const k = String(c).trim().toLowerCase();
            if (k) compSet.add(k);
          }
        }
        setStats({ total, missing, competitors: compSet.size });
      }
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

  if (!scan || !stats) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center text-gray-400 text-sm">
          Run a scan to see how you stack up against the industry benchmark.
        </CardContent>
      </Card>
    );
  }

  const score = scan.score ?? 0;
  const delta = score - INDUSTRY_AVG;
  const above = delta >= 0;

  return (
    <div className="space-y-5">
      <IndustryBenchmarkStrip
        score={score}
        competitorsFound={stats.competitors}
        promptsMissingIn={stats.missing}
        totalPrompts={stats.total}
      />

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            How you compare
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-black/40 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">Your score</div>
            <div className="text-3xl font-bold text-yellow-400">{score}</div>
            <div className="text-xs text-gray-500 mt-1">{scan.project_domain}</div>
          </div>
          <div className="p-4 rounded-lg bg-black/40 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">Industry average</div>
            <div className="text-3xl font-bold text-gray-300">{INDUSTRY_AVG}</div>
            <div className="text-xs text-gray-500 mt-1">Across tracked SaaS brands</div>
          </div>
          <div className="p-4 rounded-lg bg-black/40 border border-gray-800">
            <div className="text-xs text-gray-400 mb-1">Delta</div>
            <div className={`text-3xl font-bold ${above ? 'text-green-400' : 'text-red-400'}`}>
              {above ? '+' : ''}{delta}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {above ? 'Above the average' : 'Below the average'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-5 flex items-start gap-3">
          {above ? (
            <Award className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
          ) : (
            <Target className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
          )}
          <p className="text-sm text-gray-300">
            {above
              ? `You're ${delta} points above the industry average. Keep widening the gap by acting on your top recommendations.`
              : `You're ${Math.abs(delta)} points below the industry average. Closing this gap typically takes 3–6 actions from the Recommendations tab.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
