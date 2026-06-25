import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { logScanError } from '@/lib/errorLogger';

interface CitationRow {
  domain: string;
  engine: string;
  asset_type: string | null;
  source_type: string | null;
  url: string;
  cites_brand: string | null;
}

export function CitationIntelligenceTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) return;
      setLoading(true);
      setLoadError(null);
      try {
        const { data: scans, error: scansErr } = await supabase
          .from('scans')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (scansErr) throw scansErr;
        const scanIds = (scans || []).map((s: any) => s.id);
        if (!scanIds.length) {
          if (!cancelled) {
            setRows([]);
            setLoading(false);
          }
          return;
        }
        const { data: results, error: resultsErr } = await supabase
          .from('scan_results')
          .select('id')
          .in('scan_id', scanIds);
        if (resultsErr) throw resultsErr;
        const resultIds = (results || []).map((r: any) => r.id);
        if (!resultIds.length) {
          if (!cancelled) {
            setRows([]);
            setLoading(false);
          }
          return;
        }
        const { data: cits, error: citsErr } = await supabase
          .from('citations')
          .select('domain, engine, asset_type, source_type, url, cites_brand')
          .in('scan_result_id', resultIds)
          .limit(500);
        if (citsErr) throw citsErr;
        if (!cancelled) {
          setRows((cits || []) as any);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load citation intelligence.';
        setLoadError(msg);
        setLoading(false);
        logScanError({ error: err, component: 'CitationIntelligenceTab', errorType: 'CitationLoadError' });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

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
            <p className="text-sm text-red-100 font-medium">Couldn't load citation data</p>
            <p className="text-xs text-red-200/80 mt-1">{loadError}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center text-gray-400 text-sm">
          No citation data yet. Run a scan to capture the sources AI uses.
        </CardContent>
      </Card>
    );
  }

  // Group by domain
  const grouped = new Map<string, { count: number; engines: Set<string>; assets: Set<string>; sample: CitationRow }>();
  for (const r of rows) {
    const key = r.domain.toLowerCase();
    const entry = grouped.get(key) || { count: 0, engines: new Set(), assets: new Set(), sample: r };
    entry.count += 1;
    entry.engines.add(r.engine);
    if (r.asset_type) entry.assets.add(r.asset_type);
    grouped.set(key, entry);
  }
  const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 50);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-yellow-400/10 to-transparent border-yellow-400/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">{grouped.size} unique sources</div>
            <div className="text-xs text-gray-400">across {rows.length} citations from your recent scans</div>
          </div>
          <FileText className="h-8 w-8 text-yellow-400" />
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Top citation sources AI relies on</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sorted.map(([domain, info]) => (
              <div key={domain} className="flex items-center justify-between gap-3 p-3 border border-gray-800 rounded-lg bg-black/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:underline text-sm font-medium truncate"
                    >
                      {domain}
                    </a>
                    <ExternalLink className="h-3 w-3 text-gray-500 shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(info.engines).map((e) => (
                      <Badge key={e} variant="outline" className="text-[10px] border-gray-700 text-gray-400">
                        {e}
                      </Badge>
                    ))}
                    {Array.from(info.assets).slice(0, 3).map((a) => (
                      <Badge key={a} variant="outline" className="text-[10px] border-yellow-400/40 text-yellow-300">
                        {a.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-white">{info.count}</div>
                  <div className="text-[10px] text-gray-500 uppercase">citations</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
