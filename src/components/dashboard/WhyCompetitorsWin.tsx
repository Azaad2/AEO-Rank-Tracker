import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Swords, TrendingUp } from 'lucide-react';

interface AssetGap {
  asset_type: string;
  peer_median: number;
  user_value: number;
  gap: number;
  sample: number;
}

interface PeerRow {
  winning_brand: string;
  asset_type: string | null;
  citation_frequency: number;
  authority_score: number | null;
  recommendation_position: number | null;
  observation_count: number;
}

interface ScanLite {
  id: string;
  domain: string;
  industry_id: string | null;
  topic_cluster_id: string | null;
  created_at: string;
}

const ASSET_LABELS: Record<string, string> = {
  comparison_page: 'Comparison pages',
  review_page: 'Review pages',
  reddit_thread: 'Reddit threads',
  forum_thread: 'Forum threads',
  listicle: 'Listicles',
  directory_listing: 'Directory listings',
  blog_article: 'Blog articles',
  landing_page: 'Landing pages',
  news_article: 'News articles',
  documentation_page: 'Documentation',
  other: 'Other assets',
};

export function WhyCompetitorsWin() {
  const { user } = useAuth();
  const [scan, setScan] = useState<ScanLite | null>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);

      const { data: scans } = await supabase
        .from('scans')
        .select('id, domain, industry_id, topic_cluster_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const latest = (scans?.[0] as any) || null;
      setScan(latest);

      if (!latest) {
        setLoading(false);
        return;
      }

      const [recsRes, metricsRes] = await Promise.all([
        supabase
          .from('recommendations')
          .select('industry_benchmark, supporting_asset_types, competitor_examples, target_metric, projected_metric_delta')
          .eq('user_id', user.id)
          .eq('scan_id', latest.id),
        supabase
          .from('proprietary_metrics_cache')
          .select('narrative')
          .eq('scan_id', latest.id)
          .maybeSingle(),
      ]);
      setRecs(recsRes.data || []);
      setNarrative((metricsRes.data as any)?.narrative || null);

      if (latest.industry_id) {
        const { data: gi } = await supabase
          .from('global_intelligence')
          .select('winning_brand, asset_type, citation_frequency, authority_score, recommendation_position, observation_count')
          .eq('industry_id', latest.industry_id)
          .not('winning_brand', 'is', null)
          .order('citation_frequency', { ascending: false })
          .limit(200);
        setPeers((gi || []) as any);
      } else {
        setPeers([]);
      }

      setLoading(false);
    })();
  }, [user]);

  // Compute asset gaps from rec benchmarks
  const assetGaps = useMemo<AssetGap[]>(() => {
    const map = new Map<string, AssetGap>();
    for (const r of recs) {
      const bench = r.industry_benchmark || {};
      const types: string[] = r.supporting_asset_types || [];
      const peerMedian = Number(bench.peer_median ?? bench.median ?? 0);
      const userValue = Number(bench.user_value ?? bench.you ?? 0);
      const sample = Number(bench.peer_sample_size ?? bench.sample_size ?? 0);
      if (!peerMedian && !userValue) continue;
      for (const t of types) {
        const existing = map.get(t);
        if (!existing || peerMedian > existing.peer_median) {
          map.set(t, {
            asset_type: t,
            peer_median: peerMedian,
            user_value: userValue,
            gap: Math.max(0, peerMedian - userValue),
            sample,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.gap - a.gap);
  }, [recs]);

  const leaderboard = useMemo(() => {
    // Aggregate peer rows by brand (+ optional asset filter)
    const filtered = selectedAsset
      ? peers.filter((p) => p.asset_type === selectedAsset)
      : peers;
    const byBrand = new Map<
      string,
      { brand: string; citations: number; authoritySum: number; authorityN: number; posSum: number; posN: number; assets: Set<string> }
    >();
    for (const p of filtered) {
      const key = p.winning_brand;
      const existing = byBrand.get(key) || {
        brand: key,
        citations: 0,
        authoritySum: 0,
        authorityN: 0,
        posSum: 0,
        posN: 0,
        assets: new Set<string>(),
      };
      existing.citations += p.citation_frequency || 0;
      if (p.authority_score != null) {
        existing.authoritySum += p.authority_score;
        existing.authorityN += 1;
      }
      if (p.recommendation_position != null) {
        existing.posSum += p.recommendation_position;
        existing.posN += 1;
      }
      if (p.asset_type) existing.assets.add(p.asset_type);
      byBrand.set(key, existing);
    }
    return Array.from(byBrand.values())
      .map((b) => ({
        brand: b.brand,
        citations: b.citations,
        avgAuthority: b.authorityN ? Math.round(b.authoritySum / b.authorityN) : null,
        avgPosition: b.posN ? +(b.posSum / b.posN).toFixed(1) : null,
        topAssets: Array.from(b.assets).slice(0, 3),
      }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 10);
  }, [peers, selectedAsset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!scan) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center text-gray-400">
          Run a scan to surface competitor intelligence.
        </CardContent>
      </Card>
    );
  }

  if (!scan.industry_id || leaderboard.length < 3) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center space-y-2">
          <Swords className="h-10 w-10 text-yellow-400 mx-auto" />
          <h3 className="text-white font-semibold">Building peer intelligence</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            We need at least 3 peer brands observed in your industry to render this view. Run more scans
            or check back as the anonymized dataset grows.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxGap = Math.max(...assetGaps.map((a) => Math.max(a.peer_median, a.user_value)), 1);

  return (
    <div className="space-y-6">
      {/* Narrative */}
      <Card className="bg-gradient-to-r from-red-500/10 to-transparent border-red-500/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Where competitors lead you</h3>
              {assetGaps.length > 0 && (
                <p className="text-sm text-gray-300">
                  Competitors lead you on:{' '}
                  {assetGaps
                    .filter((a) => a.gap > 0)
                    .slice(0, 3)
                    .map((a) => (
                      <span key={a.asset_type} className="text-yellow-400">
                        {ASSET_LABELS[a.asset_type] || a.asset_type} (+{a.gap})
                      </span>
                    ))
                    .reduce((acc, el, i, arr) => {
                      acc.push(el);
                      if (i < arr.length - 1) acc.push(<span key={`s${i}`}>, </span>);
                      return acc;
                    }, [] as any[])}
                </p>
              )}
              {narrative && <p className="text-sm text-gray-400 italic">{narrative}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset breakdown */}
      {assetGaps.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Asset-type gap analysis</CardTitle>
            <p className="text-xs text-gray-400">
              You vs peer median, by asset type. Click a bar to filter the leaderboard below.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {assetGaps.map((g) => {
              const isSelected = selectedAsset === g.asset_type;
              const severity = g.gap > 5 ? 'bg-red-400' : g.gap > 2 ? 'bg-orange-400' : 'bg-yellow-400';
              return (
                <button
                  key={g.asset_type}
                  onClick={() => setSelectedAsset(isSelected ? null : g.asset_type)}
                  className={`w-full text-left rounded p-3 border transition ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-400/5'
                      : 'border-gray-800 hover:border-gray-700 bg-black/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white font-medium">
                      {ASSET_LABELS[g.asset_type] || g.asset_type}
                    </span>
                    <span className="text-xs text-gray-500">n={g.sample}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-12">You</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-gray-500"
                          style={{ width: `${(g.user_value / maxGap) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-8 text-right">{g.user_value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-12">Peers</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded overflow-hidden">
                        <div className={`h-full ${severity}`} style={{ width: `${(g.peer_median / maxGap) * 100}%` }} />
                      </div>
                      <span className="text-xs text-yellow-400 w-8 text-right">{g.peer_median}</span>
                    </div>
                  </div>
                  {g.gap > 0 && (
                    <div className="text-[11px] text-red-400 mt-1.5">Gap: {g.gap} behind</div>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-white text-base">
              Competitor leaderboard
              {selectedAsset && (
                <span className="text-sm text-yellow-400 ml-2 font-normal">
                  · {ASSET_LABELS[selectedAsset] || selectedAsset}
                </span>
              )}
            </CardTitle>
            {selectedAsset && (
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear filter
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Anonymized brands ranked by citation frequency in your industry.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="py-2 pr-3 font-normal">#</th>
                  <th className="py-2 pr-3 font-normal">Brand</th>
                  <th className="py-2 pr-3 font-normal text-right">Citations</th>
                  <th className="py-2 pr-3 font-normal text-right">Authority</th>
                  <th className="py-2 pr-3 font-normal text-right">Avg pos</th>
                  <th className="py-2 font-normal">Top assets</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((b, i) => (
                  <tr key={b.brand} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-3 text-white font-medium">{b.brand}</td>
                    <td className="py-2 pr-3 text-right text-yellow-400">{b.citations}</td>
                    <td className="py-2 pr-3 text-right text-gray-300">
                      {b.avgAuthority != null ? b.avgAuthority : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-300">
                      {b.avgPosition != null ? b.avgPosition : '—'}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1 flex-wrap">
                        {b.topAssets.map((a) => (
                          <Badge
                            key={a}
                            variant="outline"
                            className="border-gray-700 text-gray-400 text-[10px] py-0"
                          >
                            {ASSET_LABELS[a] || a}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
