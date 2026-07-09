import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ListChecks, AlertTriangle, RefreshCw } from 'lucide-react';
import { RecommendationCard, type RecommendationRow } from './RecommendationCard';
import { AIGrowthBrief } from './AIGrowthBrief';

import { ActionPlan } from './ActionPlan';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logScanError } from '@/lib/errorLogger';

type Filter = 'all' | 'quick' | 'high' | 'rss' | 'cag' | 'tsd';

export function RecommendationIntelligence() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<RecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [legacyOpen, setLegacyOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'dismissed')
      .order('priority_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('rec load error', error);
      setLoadError(error.message || 'Failed to load recommendations.');
      setRecs([]);
      logScanError({ error, component: 'RecommendationIntelligence', errorType: 'RecommendationLoadError' });
    } else {
      setRecs((data || []) as any);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Evidence-first: filter out cards without evidence as a safety net
  const evidenceBound = useMemo(
    () =>
      recs.filter((r) => {
        const hasEvidenceJson =
          r.evidence && typeof r.evidence === 'object' && Object.keys(r.evidence).length > 0;
        const hasUrls = Array.isArray(r.evidence_urls) && r.evidence_urls.length > 0;
        return hasEvidenceJson || hasUrls;
      }),
    [recs],
  );

  const metricCounts = useMemo(() => {
    const counts = { rss: 0, cag: 0, tsd: 0 };
    for (const r of evidenceBound) {
      const m = r.target_metric?.toLowerCase();
      if (m === 'rss') counts.rss++;
      else if (m === 'cag') counts.cag++;
      else if (m === 'tsd') counts.tsd++;
    }
    return counts;
  }, [evidenceBound]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'quick':
        return evidenceBound.filter((r) => r.difficulty === 'easy');
      case 'high':
        return evidenceBound.filter((r) => (r.priority_score ?? 0) >= 100);
      case 'rss':
      case 'cag':
      case 'tsd':
        return evidenceBound.filter((r) => r.target_metric?.toLowerCase() === filter);
      default:
        return evidenceBound;
    }
  }, [evidenceBound, filter]);

  const totalImpact = evidenceBound.reduce(
    (acc, r) => acc + Number(r.projected_metric_delta || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="bg-red-950/30 border-red-500/40">
        <CardContent className="p-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-300 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-100 font-medium">Couldn't load recommendations</p>
            <p className="text-xs text-red-200/80 mt-1">{loadError}</p>
          </div>
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (evidenceBound.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-yellow-400 mx-auto" />
          <h3 className="text-white font-semibold text-lg">No recommendations yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Run a scan to surface evidence-bound recommendations backed by your industry's peer data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filters: { key: Filter; label: string; count: number }[] = (
    [
      { key: 'all', label: 'All', count: evidenceBound.length },
      { key: 'quick', label: 'Quick Wins', count: evidenceBound.filter((r) => r.difficulty === 'easy').length },
      { key: 'high', label: 'High Impact', count: evidenceBound.filter((r) => (r.priority_score ?? 0) >= 100).length },
      { key: 'rss', label: 'RSS', count: metricCounts.rss },
      { key: 'cag', label: 'CAG', count: metricCounts.cag },
      { key: 'tsd', label: 'TSD', count: metricCounts.tsd },
    ] as { key: Filter; label: string; count: number }[]
  ).filter((f) => f.count > 0 || f.key === 'all');

  return (
    <div className="space-y-5">
      {/* Header strip */}
      <Card className="bg-gradient-to-r from-yellow-400/10 to-transparent border-yellow-400/30">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold text-white">
              {evidenceBound.length} prioritized actions
            </div>
            <div className="text-sm text-gray-400">
              Projected impact:{' '}
              <span className="text-green-400 font-semibold">+{totalImpact.toFixed(1)} points</span>{' '}
              across visibility metrics
            </div>
          </div>
          <div className="text-xs text-gray-500 max-w-xs text-right">
            Every card is evidence-bound. No score without proof.
          </div>
        </CardContent>
      </Card>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key)}
            className={
              filter === f.key
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'border-gray-700 text-gray-300 hover:bg-gray-800'
            }
          >
            {f.label}
            <span className="ml-1.5 opacity-60">({f.count})</span>
          </Button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {filtered.map((r) => (
          <RecommendationCard key={r.id} rec={r} onChanged={load} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No matches for this filter.</div>
        )}
      </div>

      {/* Legacy tasks */}
      <Collapsible open={legacyOpen} onOpenChange={setLegacyOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors pt-4">
            <ListChecks className="h-3 w-3" />
            {legacyOpen ? 'Hide' : 'Show'} legacy auto-fix tasks
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <ActionPlan />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
