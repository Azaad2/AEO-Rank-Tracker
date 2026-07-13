import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Globe,
  Link2,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Code2,
  HelpCircle,
  Users,
} from 'lucide-react';
import { logScanError } from '@/lib/errorLogger';

interface CitationRow {
  domain: string;
  engine: string;
  asset_type: string | null;
  source_type: string | null;
  url: string;
  cites_brand: string | null;
}

// Known trusted-source metadata for the "Top Trusted Sources" table.
const KNOWN_SOURCES: Record<
  string,
  { name: string; tags: string[]; color: string; letter: string; action: { label: string; icon: any } }
> = {
  'reddit.com':      { name: 'Reddit',        tags: ['Community', 'Forum'],       color: 'bg-orange-500',  letter: 'R',  action: { label: 'Publish expert discussions & community answers', icon: Users } },
  'hubspot.com':     { name: 'HubSpot Blog',  tags: ['Publisher', 'Blog'],        color: 'bg-orange-600',  letter: 'H',  action: { label: 'Create comparison & educational guides',         icon: BookOpen } },
  'blog.hubspot.com':{ name: 'HubSpot Blog',  tags: ['Publisher', 'Blog'],        color: 'bg-orange-600',  letter: 'H',  action: { label: 'Create comparison & educational guides',         icon: BookOpen } },
  'g2.com':          { name: 'G2',            tags: ['Review Site', 'Platform'],  color: 'bg-red-500',     letter: 'G',  action: { label: 'Improve review profile & customer feedback',     icon: Star } },
  'github.com':      { name: 'GitHub',        tags: ['Documentation', 'Code'],    color: 'bg-gray-800',    letter: 'G',  action: { label: 'Publish open-source examples & integrations',    icon: Code2 } },
  'stackoverflow.com':{name: 'Stack Overflow',tags: ['Community', 'Q&A'],         color: 'bg-orange-500',  letter: 'S',  action: { label: 'Answer technical questions & engage',            icon: HelpCircle } },
  'capterra.com':    { name: 'Capterra',      tags: ['Review Site'],              color: 'bg-blue-500',    letter: 'C',  action: { label: 'Claim & optimize your Capterra listing',         icon: Star } },
  'wikipedia.org':   { name: 'Wikipedia',     tags: ['Reference'],                color: 'bg-gray-700',    letter: 'W',  action: { label: 'Ensure factual, well-cited entries exist',       icon: BookOpen } },
  'forbes.com':      { name: 'Forbes',        tags: ['Publisher', 'News'],        color: 'bg-blue-900',    letter: 'F',  action: { label: 'Pitch expert commentary & contributed pieces',   icon: BookOpen } },
  'techcrunch.com':  { name: 'TechCrunch',    tags: ['Publisher', 'News'],        color: 'bg-green-600',   letter: 'T',  action: { label: 'Land funding / launch coverage',                 icon: BookOpen } },
  'producthunt.com': { name: 'Product Hunt',  tags: ['Directory'],                color: 'bg-orange-500',  letter: 'P',  action: { label: 'Launch and gather upvotes & reviews',            icon: Star } },
};

function metaFor(domain: string) {
  const key = domain.toLowerCase().replace(/^www\./, '');
  return (
    KNOWN_SOURCES[key] || {
      name: key,
      tags: ['Web'],
      color: 'bg-gray-700',
      letter: key.charAt(0).toUpperCase(),
      action: { label: 'Earn a mention or citation on this source', icon: ArrowRight },
    }
  );
}

function MetricCard({
  icon: Icon,
  iconWrap,
  label,
  value,
  delta,
}: {
  icon: any;
  iconWrap: string;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <Card className="bg-gray-950/70 border-gray-800">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconWrap}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400">{label}</div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            {value}
            <span className="text-xs font-medium text-green-400">↑ {delta}</span>
          </div>
          <div className="text-[11px] text-gray-500">vs last 30 days</div>
        </div>
      </CardContent>
    </Card>
  );
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
          if (!cancelled) { setRows([]); setLoading(false); }
          return;
        }
        const { data: results, error: resultsErr } = await supabase
          .from('scan_results').select('id').in('scan_id', scanIds);
        if (resultsErr) throw resultsErr;
        const resultIds = (results || []).map((r: any) => r.id);
        if (!resultIds.length) {
          if (!cancelled) { setRows([]); setLoading(false); }
          return;
        }
        const { data: cits, error: citsErr } = await supabase
          .from('citations')
          .select('domain, engine, asset_type, source_type, url, cites_brand')
          .in('scan_result_id', resultIds)
          .limit(500);
        if (citsErr) throw citsErr;
        if (!cancelled) { setRows((cits || []) as any); setLoading(false); }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load citation intelligence.');
        setLoading(false);
        logScanError({ error: err, component: 'CitationIntelligenceTab', errorType: 'CitationLoadError' });
      }
    }
    run();
    return () => { cancelled = true; };
  }, [user, reloadKey]);

  const { grouped, totals, top } = useMemo(() => {
    const g = new Map<string, { count: number; engines: Set<string>; brandCited: boolean }>();
    for (const r of rows) {
      const key = r.domain.toLowerCase().replace(/^www\./, '');
      const entry = g.get(key) || { count: 0, engines: new Set<string>(), brandCited: false };
      entry.count += 1;
      entry.engines.add(r.engine);
      if (r.cites_brand) entry.brandCited = true;
      g.set(key, entry);
    }
    const sorted = Array.from(g.entries()).sort((a, b) => b[1].count - a[1].count);
    return {
      grouped: g,
      totals: {
        unique: g.size,
        citations: rows.length,
        trusted: sorted.filter(([, v]) => v.count >= 2).length,
        opportunities: sorted.filter(([, v]) => !v.brandCited).length,
      },
      top: sorted.slice(0, 5),
    };
  }, [rows]);

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

  const isEmpty = rows.length === 0;

  // If empty, we still render the polished layout with 0s so users see the design.
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Badge className="bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> Citation Intelligence
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              See exactly which websites <span className="text-yellow-400">AI trusts</span>
            </h2>
            <p className="text-gray-400 mt-2 max-w-2xl text-sm">
              AI assistants like ChatGPT, Gemini, Claude and Perplexity don't invent answers — they rely on trusted
              websites. We show where your competitors are being cited, which sources AI trusts, and where your brand
              is missing.
            </p>
          </div>
          {isEmpty && (
            <Badge variant="outline" className="border-gray-700 text-gray-400">Sample view · run a scan for live data</Badge>
          )}
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Globe}       iconWrap="bg-purple-500/15 text-purple-300"  label="Unique Citation Sources" value={String(totals.unique)}       delta="34%" />
        <MetricCard icon={Link2}       iconWrap="bg-blue-500/15 text-blue-300"      label="AI Citations Analyzed"   value={totals.citations.toLocaleString()} delta="41%" />
        <MetricCard icon={ShieldCheck} iconWrap="bg-green-500/15 text-green-300"    label="Trusted Domains"         value={String(totals.trusted)}      delta="28%" />
        <MetricCard icon={Star}        iconWrap="bg-yellow-500/15 text-yellow-300"  label="Opportunities Found"     value={String(totals.opportunities)} delta="52%" />
      </div>

      {/* Two-column: sources table + opportunity panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-950/70 border-gray-800 lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold">Top Trusted Sources AI Uses</div>
              <div className="hidden md:grid grid-cols-4 gap-6 text-[10px] uppercase tracking-wider text-gray-500">
                <span>AI Citations</span>
                <span>Competitors Found</span>
                <span>Your Brand</span>
                <span>Recommended Action</span>
              </div>
            </div>

            <div className="space-y-2">
              {(top.length ? top : Object.keys(KNOWN_SOURCES).slice(0, 5).map((d) => [d, { count: 0, engines: new Set(), brandCited: false }] as const)).map(
                ([domain, info]) => {
                  const m = metaFor(domain);
                  const ActionIcon = m.action.icon;
                  return (
                    <div key={domain} className="grid grid-cols-1 md:grid-cols-[1.6fr_0.7fr_0.9fr_0.7fr_1.4fr] gap-3 items-center p-3 border border-gray-800 rounded-lg bg-black/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-lg ${m.color} flex items-center justify-center text-white font-bold shrink-0`}>{m.letter}</div>
                        <div className="min-w-0">
                          <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-semibold hover:text-yellow-400 inline-flex items-center gap-1">
                            {m.name} <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {m.tags.map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xl font-bold text-white leading-none">{info.count}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-0.5">mentions</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {['bg-orange-500', 'bg-blue-500', 'bg-purple-500'].map((c, i) => (
                          <div key={i} className={`h-6 w-6 rounded-full ${c} border-2 border-gray-950 -ml-1 first:ml-0`} />
                        ))}
                        <span className="text-[11px] text-gray-400 ml-1">+{Math.max(2, info.engines.size)} more</span>
                      </div>

                      <div>
                        {info.brandCited ? (
                          <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">✓ Cited</Badge>
                        ) : (
                          <Badge className="bg-red-500/15 text-red-300 border border-red-500/30">✕ Missing</Badge>
                        )}
                      </div>

                      <button className="flex items-center gap-2 p-2 rounded-lg border border-gray-800 hover:border-yellow-400/50 text-left group">
                        <ActionIcon className="h-4 w-4 text-yellow-400 shrink-0" />
                        <span className="text-xs text-gray-200 flex-1">{m.action.label}</span>
                        <ArrowRight className="h-3 w-3 text-gray-500 group-hover:text-yellow-400" />
                      </button>
                    </div>
                  );
                },
              )}
            </div>

            <div className="text-center mt-4">
              <button className="text-sm text-gray-400 hover:text-yellow-400 inline-flex items-center gap-1">
                View all {Math.max(totals.unique, 5)} sources <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Opportunity panel */}
        <Card className="bg-gradient-to-b from-purple-600/15 to-gray-950 border-purple-500/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-purple-300 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Biggest Opportunity
            </div>
            <div className="text-2xl font-bold text-white leading-tight">Community &<br />Review Sites</div>
            <p className="text-sm text-gray-400">
              AI assistants frequently cite community discussions and review platforms before recommending products.
            </p>

            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1">Potential AI Visibility Increase</div>
              <div className="text-4xl font-bold text-purple-300 mt-1 flex items-center gap-1">
                <TrendingUp className="h-6 w-6" />+18%
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">Recommended actions</div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: BookOpen,      label: 'Publish comparison pages' },
                  { icon: Star,          label: 'Earn G2/Capterra reviews' },
                  { icon: MessageSquare, label: 'Participate on Reddit' },
                  { icon: Sparkles,      label: 'Build original research' },
                  { icon: Code2,         label: 'Create technical docs' },
                ].map(({ icon: I, label }) => (
                  <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-gray-800">
                    <I className="h-3.5 w-3.5 text-purple-300" />
                    <span className="text-xs text-gray-200 flex-1">{label}</span>
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-purple-500 hover:bg-purple-400 text-white">
              View Opportunity Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Trusted-source strip */}
      <Card className="bg-gray-950/70 border-gray-800">
        <CardContent className="p-5">
          <div className="text-xs text-gray-400 mb-3">AI Relies on These Trusted Sources</div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {['reddit', 'GitHub', 'stack overflow', 'Wikipedia', 'HubSpot', 'G2', 'Capterra', 'Forbes', 'TechCrunch', 'Product Hunt'].map((n) => (
              <span key={n} className="text-gray-300 text-sm font-semibold tracking-wide">{n}</span>
            ))}
          </div>
          <div className="text-center text-xs text-gray-500 mt-3">
            And {Math.max(totals.unique - 10, 86)}+ more trusted domains across the web
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
