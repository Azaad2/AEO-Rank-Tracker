import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface MetricsRow {
  scan_id: string;
  rss: number | null;
  cag: number | null;
  tsd: number | null;
  cis_top: any;
  coi: any;
  rss_breakdown: any;
  cag_breakdown: any;
  tsd_breakdown: any;
  deltas: any;
  explanation: any;
  narrative: string | null;
  confidence_score: number | null;
  sample_size: any;
}

const METRIC_DEFS = [
  { key: 'rss', label: 'RSS', name: 'Recommendation Source Score', breakdownKey: 'rss_breakdown' },
  { key: 'cag', label: 'CAG', name: 'Competitor Authority Gap', breakdownKey: 'cag_breakdown' },
  { key: 'tsd', label: 'TSD', name: 'Trust Source Density', breakdownKey: 'tsd_breakdown' },
] as const;

export function MetricsExplain() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMetric, setOpenMetric] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: scans } = await supabase
        .from('scans')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const scanId = scans?.[0]?.id;
      if (!scanId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('proprietary_metrics_cache')
        .select('*')
        .eq('scan_id', scanId)
        .maybeSingle();
      setMetrics(data as any);
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

  if (!metrics) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center text-gray-400">
          Run a scan to compute proprietary metrics with full explainability.
        </CardContent>
      </Card>
    );
  }

  const deltas = metrics.deltas || {};
  const sample = metrics.sample_size || {};
  const cisTop: any[] = Array.isArray(metrics.cis_top) ? metrics.cis_top : [];
  const coi: any = metrics.coi || {};

  const renderDelta = (key: string) => {
    const d = Number(deltas?.[key] ?? 0);
    if (d === 0) return <span className="text-gray-500 inline-flex items-center"><Minus className="h-3 w-3 mr-0.5" />0</span>;
    if (d > 0) return <span className="text-green-400 inline-flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" />+{d.toFixed(1)}</span>;
    return <span className="text-red-400 inline-flex items-center"><TrendingDown className="h-3 w-3 mr-0.5" />{d.toFixed(1)}</span>;
  };

  const activeMetric = METRIC_DEFS.find((m) => m.key === openMetric);
  const activeBreakdown = activeMetric ? (metrics as any)[activeMetric.breakdownKey] || {} : {};

  return (
    <div className="space-y-5">
      {metrics.narrative && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 italic">{metrics.narrative}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRIC_DEFS.map((m) => {
          const value = (metrics as any)[m.key];
          const n = sample[m.key];
          return (
            <button
              key={m.key}
              onClick={() => setOpenMetric(m.key)}
              className="text-left bg-gray-900 border border-gray-800 hover:border-yellow-400/50 rounded-lg p-4 transition"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-gray-500">{m.label}</span>
                {renderDelta(m.key)}
              </div>
              <div className="text-3xl font-bold text-white">
                {value != null ? Number(value).toFixed(1) : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-1">{m.name}</div>
              {n != null && <div className="text-[10px] text-gray-600 mt-1">n={n}</div>}
            </button>
          );
        })}

        {/* CIS tile (top sources) */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">CIS</div>
          <div className="text-sm text-white font-medium mb-2">Citation Influence Sources</div>
          <ul className="space-y-1">
            {cisTop.slice(0, 4).map((s: any, i: number) => (
              <li key={i} className="text-xs text-gray-400 flex justify-between">
                <span className="truncate mr-2">{s.source || s.domain || '—'}</span>
                <span className="text-yellow-400 shrink-0">{s.score ?? s.weight ?? ''}</span>
              </li>
            ))}
            {cisTop.length === 0 && <li className="text-xs text-gray-600">No data</li>}
          </ul>
        </div>

        {/* COI tile */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">COI</div>
          <div className="text-sm text-white font-medium mb-2">Competitor Overlap Index</div>
          {Object.keys(coi).length > 0 ? (
            <ul className="space-y-1">
              {Object.entries(coi).slice(0, 4).map(([k, v]) => (
                <li key={k} className="text-xs text-gray-400 flex justify-between">
                  <span className="truncate mr-2">{k}</span>
                  <span className="text-yellow-400 shrink-0">{String(v)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-gray-600">No data</div>
          )}
        </div>

        {/* Confidence */}
        {metrics.confidence_score != null && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Confidence</div>
            <div className="text-3xl font-bold text-white">
              {Math.round(Number(metrics.confidence_score) * 100)}%
            </div>
            <div className="h-1.5 bg-gray-800 rounded mt-2 overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${Number(metrics.confidence_score) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Sheet open={!!openMetric} onOpenChange={(o) => !o && setOpenMetric(null)}>
        <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto">
          {activeMetric && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">
                  {activeMetric.label} · {activeMetric.name}
                </SheetTitle>
                <SheetDescription className="text-gray-400">
                  Why this score is what it is.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Current</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-white">
                      {(metrics as any)[activeMetric.key]?.toFixed(1) ?? '—'}
                    </span>
                    {renderDelta(activeMetric.key)}
                  </div>
                </div>

                {Object.keys(activeBreakdown).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Contributing factors</h4>
                    <ul className="space-y-2">
                      {Object.entries(activeBreakdown).map(([k, v]: any) => (
                        <li
                          key={k}
                          className="flex justify-between items-center bg-black/40 border border-gray-800 rounded px-3 py-2"
                        >
                          <span className="text-sm text-gray-300">{k.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-yellow-400 font-mono">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(metrics.explanation) && metrics.explanation.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Explanation</h4>
                    <ul className="space-y-1.5">
                      {metrics.explanation
                        .filter((e: any) => !e.metric || e.metric.toLowerCase() === activeMetric.key)
                        .map((e: any, i: number) => (
                          <li key={i} className="text-sm text-gray-300">
                            • {typeof e === 'string' ? e : e.text || e.message || JSON.stringify(e)}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
