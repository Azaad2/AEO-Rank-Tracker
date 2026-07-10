import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, ArrowRight } from 'lucide-react';
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

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 via-gray-900 to-gray-900 border-orange-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          Hot opportunities this week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-3">
          {rows.map(r => (
            <li key={r.prompt_template_hash} className="flex items-start gap-2 text-xs">
              <span className="text-orange-400 shrink-0 mt-0.5">🔥</span>
              <span className="text-gray-200 line-clamp-1 flex-1">{r.display_text ?? 'Trending question'}</span>
              <span className="text-yellow-400 font-bold shrink-0">
                {r.growth_pct >= 999 ? 'new' : `+${r.growth_pct}%`}
              </span>
            </li>
          ))}
        </ul>
        <Button size="sm" onClick={onOpen} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
          See all opportunities <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
