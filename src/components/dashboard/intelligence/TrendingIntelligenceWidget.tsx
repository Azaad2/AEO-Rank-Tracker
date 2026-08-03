import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, ArrowRight, TrendingUp, ShieldCheck, Database } from 'lucide-react';
import type { TrendingPrompt } from './PromptCard';

export function TrendingIntelligenceWidget({ onOpen, industryId }: { onOpen: () => void; industryId?: string | null }) {
  const [rows, setRows] = useState<TrendingPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase.from('prompt_intelligence_trending' as any)
      .select('prompt_template_hash, display_text, industry_name, growth_pct, opportunity_score, trend_bucket, scans_7d')
      .in('trend_bucket', ['exploding', 'growing'])
      .order('opportunity_score', { ascending: false })
      .limit(3);
    if (industryId) q = q.eq('industry_id', industryId);
    q.then(({ data }) => { setRows((data ?? []) as unknown as TrendingPrompt[]); setLoading(false); });
  }, [industryId]);

  if (loading || rows.length === 0) return null;

  const totalScans = rows.reduce((sum, r) => sum + (r.scans_7d ?? 0), 0);

  return (
    <Card className="bg-gradient-to-br from-orange-500/15 via-gray-900 to-gray-900 border-orange-500/40 shadow-lg shadow-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          Hot opportunities this week
        </CardTitle>
        <p className="text-xs text-gray-400 mt-1">
          Real questions people are asking AI right now — spotted from live scans across ChatGPT, Claude, Gemini and Perplexity.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-4">
          {rows.map((r, idx) => (
            <li key={r.prompt_template_hash} className="flex items-center gap-3 bg-black/30 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/20 shrink-0">
                <span className="text-sm font-bold text-orange-400">{idx + 1}</span>
              </div>
              <span className="text-sm text-gray-200 flex-1 leading-snug">{r.display_text ?? 'Trending question'}</span>
              <div className="flex flex-col items-end shrink-0">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500 text-white font-bold text-sm shadow-sm">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {r.growth_pct >= 999 ? 'NEW' : `+${r.growth_pct}%`}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  {r.scans_7d ?? 0} scans this week
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-green-400" />
            <span>Backed by {totalScans.toLocaleString()} real scans this week</span>
            <Database className="h-3.5 w-3.5 text-gray-600 ml-1" />
          </div>
          <Button size="sm" onClick={onOpen} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
            See all opportunities <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

