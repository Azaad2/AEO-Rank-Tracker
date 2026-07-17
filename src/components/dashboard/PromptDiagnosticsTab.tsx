import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Loader2,
  Sparkles,
  Trophy,
  TrendingUp,
  Eye,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  BookOpen,
  Star,
  Users,
  Info,
} from 'lucide-react';

// ------------- Types -------------

interface CitationRow {
  scan_result_id: number;
  engine: string;
  url: string;
  domain: string;
  asset_type: string | null;
  title: string | null;
  cites_brand: string | null;
  position: number | null;
}

interface ResultRow {
  id: number;
  prompt: string;
  mentioned: boolean | null;
  cited: boolean | null;
  gemini_mentioned: boolean | null;
  gemini_cited: boolean | null;
  gemini_competitors: string[] | null;
  chatgpt_mentioned: boolean | null;
  chatgpt_cited: boolean | null;
  chatgpt_competitors: string[] | null;
  perplexity_mentioned: boolean | null;
  perplexity_cited: boolean | null;
  perplexity_competitors: string[] | null;
  claude_mentioned: boolean | null;
  claude_cited: boolean | null;
  claude_competitors: string[] | null;
  top_cited_domains: string[] | null;
}

// ------------- Helpers -------------

const ASSET_META: Record<
  string,
  { label: string; icon: typeof FileText; toolPath: string; toolLabel: string }
> = {
  comparison_page: { label: 'Comparison page', icon: FileText, toolPath: '/tools/competitor-analyzer', toolLabel: 'Generate Comparison' },
  review_page:     { label: 'Review page',     icon: Star,     toolPath: '/tools/ai-answer-generator', toolLabel: 'Generate Review' },
  reddit_thread:   { label: 'Reddit discussion', icon: Users, toolPath: '/tools/ai-answer-generator', toolLabel: 'Generate Reddit answer' },
  forum_thread:    { label: 'Forum answer',    icon: MessageSquare, toolPath: '/tools/ai-answer-generator', toolLabel: 'Generate Forum answer' },
  listicle:        { label: 'Listicle / alternatives', icon: BookOpen, toolPath: '/tools/ai-blog-outline', toolLabel: 'Generate Listicle' },
  blog_article:    { label: 'Educational guide', icon: BookOpen, toolPath: '/tools/ai-blog-outline', toolLabel: 'Generate Guide' },
  documentation_page: { label: 'Documentation', icon: FileText, toolPath: '/tools/ai-blog-outline', toolLabel: 'Generate Docs' },
  directory_listing: { label: 'Directory listing', icon: FileText, toolPath: '/tools/ai-citation-tracker', toolLabel: 'Find Directories' },
  news_article:    { label: 'PR / News mention', icon: FileText, toolPath: '/tools/brand-monitor', toolLabel: 'Track News' },
  landing_page:    { label: 'Landing page',    icon: FileText, toolPath: '/tools/meta-optimizer', toolLabel: 'Optimize Landing' },
};

const CORE_GAP_TYPES = ['comparison_page', 'review_page', 'reddit_thread', 'listicle', 'blog_article', 'documentation_page'];

function computeVisibility(r: ResultRow) {
  const signals = [
    r.mentioned, r.cited,
    r.gemini_mentioned, r.gemini_cited,
    r.chatgpt_mentioned, r.chatgpt_cited,
    r.perplexity_mentioned, r.perplexity_cited,
    r.claude_mentioned, r.claude_cited,
  ];
  const present = signals.filter(s => s !== null && s !== undefined);
  const hits = present.filter(Boolean).length;
  const pct = present.length ? Math.round((hits / present.length) * 100) : 0;
  return { pct, hits, total: present.length };
}

function healthFor(pct: number) {
  if (pct >= 70) return { label: 'Recommended', color: 'text-green-400', dot: 'bg-green-500', ring: 'stroke-green-500', badge: 'bg-green-500/15 text-green-300 border-green-500/40', emoji: '🟢' };
  if (pct >= 40) return { label: 'Weakly Recommended', color: 'text-yellow-400', dot: 'bg-yellow-500', ring: 'stroke-yellow-400', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40', emoji: '🟡' };
  if (pct > 0)   return { label: 'Barely Visible', color: 'text-orange-400', dot: 'bg-orange-500', ring: 'stroke-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/40', emoji: '🟠' };
  return { label: 'Not Recommended', color: 'text-red-400', dot: 'bg-red-500', ring: 'stroke-red-500', badge: 'bg-red-500/15 text-red-300 border-red-500/40', emoji: '🔴' };
}

function opportunityFor(r: ResultRow, competitorCount: number, pct: number) {
  // Opportunity = signal that rivals exist but you're invisible
  if (pct >= 60) return { label: 'Low', tone: 'text-gray-300', badge: 'bg-gray-800 text-gray-300 border-gray-700' };
  if (competitorCount >= 3) return { label: 'High', tone: 'text-yellow-300', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40' };
  if (competitorCount >= 1) return { label: 'Medium', tone: 'text-blue-300', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/40' };
  return { label: 'Emerging', tone: 'text-gray-300', badge: 'bg-gray-800 text-gray-300 border-gray-700' };
}

function Gauge({ pct, size = 96 }: { pct: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const h = healthFor(pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-gray-800" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className={`${h.ring} transition-all duration-700`}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${h.color}`}>{pct}%</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500">Visible</span>
      </div>
    </div>
  );
}

function Favicon({ domain, size = 16 }: { domain: string; size?: number }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={size}
      height={size}
      className="rounded-sm flex-shrink-0"
      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
    />
  );
}

// ------------- Component -------------

const SEARCH_SOURCES = ['Google', 'Reddit', 'G2', 'Capterra', 'TrustRadius', 'AI search results'];
type EnrichCounts = { pages: number; reviewSites: number; comparisonPages: number; citations: number };
type EnrichProgress = { steps: string[]; active: boolean; counts?: EnrichCounts };

export function PromptDiagnosticsTab() {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [citationsByResult, setCitationsByResult] = useState<Record<number, CitationRow[]>>({});
  const [domain, setDomain] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrichProgress, setEnrichProgress] = useState<Record<number, EnrichProgress>>({});

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
      const brandName = String(latest.project_domain).replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
      setBrand(brandName);

      const { data: rs } = await supabase
        .from('scan_results')
        .select('id, prompt, mentioned, cited, gemini_mentioned, gemini_cited, gemini_competitors, chatgpt_mentioned, chatgpt_cited, chatgpt_competitors, perplexity_mentioned, perplexity_cited, perplexity_competitors, claude_mentioned, claude_cited, claude_competitors, top_cited_domains')
        .eq('scan_id', latest.id);

      const rows = (rs || []) as ResultRow[];
      setResults(rows);

      let grouped: Record<number, CitationRow[]> = {};
      if (rows.length) {
        const ids = rows.map(r => r.id);
        const { data: cits } = await supabase
          .from('citations')
          .select('scan_result_id, engine, url, domain, asset_type, title, cites_brand, position')
          .in('scan_result_id', ids);
        for (const c of (cits || []) as CitationRow[]) {
          (grouped[c.scan_result_id] ||= []).push(c);
        }
        setCitationsByResult(grouped);
      }
      setLoading(false);

      // Auto-enrich prompts with no evidence yet — throttled sequentially
      const missing = rows.filter(r => !(grouped[r.id] && grouped[r.id].length > 0));
      for (const r of missing.slice(0, 8)) {
        setEnrichProgress(prev => ({ ...prev, [r.id]: { steps: [], active: true } }));
        // Tick sources every 500ms while the call is in flight
        let stepIdx = 0;
        const tick = setInterval(() => {
          stepIdx = Math.min(stepIdx + 1, SEARCH_SOURCES.length);
          setEnrichProgress(prev => {
            const cur = prev[r.id];
            if (!cur || !cur.active) return prev;
            return { ...prev, [r.id]: { ...cur, steps: SEARCH_SOURCES.slice(0, stepIdx) } };
          });
          if (stepIdx >= SEARCH_SOURCES.length) clearInterval(tick);
        }, 500);
        try {
          const { data } = await supabase.functions.invoke('enrich-prompt-evidence', {
            body: { scan_result_id: r.id, prompt: r.prompt, brand: brandName },
          });
          const fresh = (data?.citations || []) as any[];
          if (fresh.length) {
            const newRows: CitationRow[] = fresh.map((c: any) => ({
              scan_result_id: r.id,
              engine: 'search',
              url: c.url,
              domain: c.domain,
              asset_type: c.asset_type ?? null,
              title: c.title ?? null,
              cites_brand: c.cites_brand ?? null,
              position: c.position ?? null,
            }));
            setCitationsByResult(prev => ({ ...prev, [r.id]: [...(prev[r.id] || []), ...newRows] }));
          }
          const uniqUrls = new Set(fresh.map((c: any) => c.url));
          const reviewSites = new Set(
            fresh.filter((c: any) => c.source_type === 'review_site').map((c: any) => c.domain)
          );
          const comparisonPages = fresh.filter((c: any) => c.asset_type === 'comparison_page').length;
          const counts: EnrichCounts = {
            pages: uniqUrls.size,
            reviewSites: reviewSites.size,
            comparisonPages,
            citations: fresh.length,
          };
          clearInterval(tick);
          setEnrichProgress(prev => ({
            ...prev,
            [r.id]: { steps: SEARCH_SOURCES, active: false, counts },
          }));
        } catch (e) {
          console.error('enrich failed', e);
          clearInterval(tick);
          setEnrichProgress(prev => ({ ...prev, [r.id]: { steps: SEARCH_SOURCES, active: false } }));
        }
      }
    })();
  }, [user]);


  // ----- Summary -----
  const summary = useMemo(() => {
    if (!results.length) return null;
    const perPrompt = results.map(r => computeVisibility(r).pct);
    const avg = Math.round(perPrompt.reduce((a, b) => a + b, 0) / perPrompt.length);
    const winning = perPrompt.filter(p => p >= 60).length;
    // Projected gain: for each losing prompt with rivals, assume 8% lift potential
    const gain = results.reduce((acc, r) => {
      const pct = computeVisibility(r).pct;
      const comps = new Set([
        ...(r.gemini_competitors || []),
        ...(r.chatgpt_competitors || []),
        ...(r.perplexity_competitors || []),
        ...(r.claude_competitors || []),
      ].map(c => c.trim().toLowerCase()).filter(Boolean));
      if (pct < 60 && comps.size > 0) return acc + Math.min(12, 4 + comps.size * 2);
      return acc;
    }, 0);
    return {
      scanned: results.length,
      visibility: avg,
      winning,
      gain: Math.min(60, gain),
    };
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!results.length) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-10 text-center text-gray-400 text-sm">
          No prompt intelligence yet. Run a scan to see how AI answers your prompts.
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Prompt Intelligence</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-3xl">
            See exactly how AI answered every prompt, why competitors won, and what you need to create to become the recommended answer.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {domain} · {results.length} prompt{results.length === 1 ? '' : 's'} analyzed
          </p>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard label="Prompts scanned" value={String(summary.scanned)} icon={Eye} />
            <SummaryCard label="AI Visibility" value={`${summary.visibility}%`} icon={Sparkles} tone={summary.visibility >= 60 ? 'good' : summary.visibility >= 30 ? 'warn' : 'bad'} />
            <SummaryCard label="Prompts you're winning" value={`${summary.winning}`} icon={Trophy} tone={summary.winning > 0 ? 'good' : 'bad'} />
            <SummaryCard label="Estimated visibility gain" value={`+${summary.gain}%`} icon={TrendingUp} tone="accent" hint="If you publish the missing assets below" />
          </div>
        )}

        {/* Prompt cards */}
        <div className="space-y-4">
          {results.map((r, idx) => (
            <PromptCard
              key={r.id}
              index={idx}
              row={r}
              citations={citationsByResult[r.id] || []}
              brand={brand}
              enriching={!!enriching[r.id]}
            />
          ))}

        </div>
      </div>
    </TooltipProvider>
  );
}

// ------------- Sub-components -------------

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'accent';
  hint?: string;
}) {
  const toneCls =
    tone === 'good' ? 'text-green-400' :
    tone === 'warn' ? 'text-yellow-400' :
    tone === 'bad' ? 'text-red-400' :
    tone === 'accent' ? 'text-yellow-400' :
    'text-white';
  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">{label}</span>
          <Icon className={`h-4 w-4 ${toneCls}`} />
        </div>
        <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
        {hint && <div className="text-[10px] text-gray-500 mt-1 leading-snug">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function PromptCard({
  index,
  row,
  citations,
  brand,
  enriching = false,
}: {
  index: number;
  row: ResultRow;
  citations: CitationRow[];
  brand: string;
  enriching?: boolean;
}) {

  const { pct } = computeVisibility(row);
  const health = healthFor(pct);

  // Competitors merged & ranked
  const compCounts = new Map<string, number>();
  for (const c of [
    ...(row.gemini_competitors || []),
    ...(row.chatgpt_competitors || []),
    ...(row.perplexity_competitors || []),
    ...(row.claude_competitors || []),
  ]) {
    const key = c.trim();
    if (!key) continue;
    compCounts.set(key, (compCounts.get(key) || 0) + 1);
  }
  const rankedCompetitors = [...compCounts.entries()].sort((a, b) => b[1] - a[1]);
  const winner = rankedCompetitors[0]?.[0];
  const opp = opportunityFor(row, compCounts.size, pct);

  // AI confidence = agreement across engines that named a competitor
  const enginesNamingWinner = winner
    ? ['gemini_competitors', 'chatgpt_competitors', 'perplexity_competitors', 'claude_competitors'].filter(k => {
        const list = (row as any)[k] as string[] | null;
        return list?.some(x => x.trim().toLowerCase() === winner.toLowerCase());
      }).length
    : 0;
  const confidence = winner ? Math.min(99, 60 + enginesNamingWinner * 10) : 55;

  // Winner asset evidence (from citations)
  const winnerCitations = winner
    ? citations.filter(c => (c.cites_brand || '').toLowerCase().includes(winner.toLowerCase()))
    : [];
  const winnerAssetTypes = new Set(winnerCitations.map(c => c.asset_type).filter(Boolean) as string[]);
  const winnerDomains = new Set(winnerCitations.map(c => c.domain));

  // AI sources (per engine)
  const sourcesByDomain = new Map<string, Set<string>>();
  for (const c of citations) {
    if (!sourcesByDomain.has(c.domain)) sourcesByDomain.set(c.domain, new Set());
    sourcesByDomain.get(c.domain)!.add(c.engine);
  }
  const topSources = [...sourcesByDomain.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 6);

  // Your assets vs competitor assets → gaps
  const yourCitations = citations.filter(c => (c.cites_brand || '').toLowerCase().includes(brand.toLowerCase()));
  const yourAssetTypes = new Set(yourCitations.map(c => c.asset_type).filter(Boolean) as string[]);
  const competitorAllAssetTypes = new Set(
    citations
      .filter(c => c.cites_brand && !((c.cites_brand || '').toLowerCase().includes(brand.toLowerCase())))
      .map(c => c.asset_type)
      .filter(Boolean) as string[]
  );

  // Gaps = asset types competitors have that you don't, plus core types if no data yet
  const evidenceGaps = [...competitorAllAssetTypes].filter(t => !yourAssetTypes.has(t));
  const gapAssetTypes = evidenceGaps.length
    ? evidenceGaps
    : CORE_GAP_TYPES.filter(t => !yourAssetTypes.has(t));

  // Projections
  const proj = {
    visFrom: pct,
    visTo: Math.min(100, pct + Math.min(30, 6 + gapAssetTypes.length * 4)),
    citesFrom: yourCitations.length,
    citesTo: yourCitations.length + Math.max(4, gapAssetTypes.length * 3),
    domainsFrom: new Set(yourCitations.map(c => c.domain)).size,
    domainsTo: new Set(yourCitations.map(c => c.domain)).size + Math.max(2, gapAssetTypes.length),
  };

  const enginesForWinner: string[] = [];
  if (row.chatgpt_competitors?.some(x => x.toLowerCase() === (winner || '').toLowerCase())) enginesForWinner.push('ChatGPT');
  if (row.gemini_competitors?.some(x => x.toLowerCase() === (winner || '').toLowerCase())) enginesForWinner.push('Gemini');
  if (row.perplexity_competitors?.some(x => x.toLowerCase() === (winner || '').toLowerCase())) enginesForWinner.push('Perplexity');
  if (row.claude_competitors?.some(x => x.toLowerCase() === (winner || '').toLowerCase())) enginesForWinner.push('Claude');

  return (
    <Card className="bg-gradient-to-b from-gray-900 to-gray-900/60 border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-5 md:p-6 space-y-5">
        {/* Top row: gauge + prompt + status */}
        <div className="flex flex-col md:flex-row items-start gap-5">
          <Gauge pct={pct} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${health.badge} border text-[10px]`}>
                {health.emoji} {health.label}
              </Badge>
              <Badge className={`${opp.badge} border text-[10px]`}>Opportunity: {opp.label}</Badge>
              <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">
                AI confidence {confidence}%
              </Badge>
              {enriching && (
                <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/40 border text-[10px] flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Discovering live evidence…
                </Badge>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Prompt #{index + 1}</div>
            <div className="text-white text-base md:text-lg font-semibold leading-snug">{row.prompt}</div>

            {/* Section 1: What happened */}
            <div className="mt-3 rounded-lg border border-gray-800 bg-black/40 p-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">What happened</div>
              {winner ? (
                <div className="text-sm text-gray-200">
                  AI recommended{' '}
                  <span className="font-semibold text-white capitalize">{winner}</span>
                  {enginesForWinner.length > 0 && (
                    <span className="text-gray-400"> across {enginesForWinner.join(', ')}</span>
                  )}
                  . Your brand was <span className="text-red-400 font-medium">not recommended</span>.
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  We don't yet have enough evidence to identify a winning brand for this prompt.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2 + 3: Why they won + AI Sources */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Why AI chose them */}
          <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
            <div className="text-[11px] uppercase tracking-wide text-yellow-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Why AI chose them
            </div>
            {winner ? (
              winnerAssetTypes.size > 0 || winnerDomains.size > 0 ? (
                <ul className="space-y-1.5 text-sm text-gray-200">
                  {[...winnerAssetTypes].slice(0, 5).map(t => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <span>{ASSET_META[t]?.label ?? t.replace(/_/g, ' ')} cited by AI</span>
                    </li>
                  ))}
                  {winnerDomains.size > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <span>Cited on {winnerDomains.size} trusted publisher{winnerDomains.size === 1 ? '' : 's'}</span>
                    </li>
                  )}
                  {enginesNamingWinner >= 2 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <span>Named by {enginesNamingWinner} AI engines (topical authority)</span>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-sm text-gray-400">
                  <span className="font-medium text-gray-300">{winner}</span> was named by AI, but we don't yet have enough citation evidence to explain why.
                </div>
              )
            ) : (
              <div className="text-sm text-gray-400">We don't yet have enough evidence.</div>
            )}
          </div>

          {/* AI Sources */}
          <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
            <div className="text-[11px] uppercase tracking-wide text-blue-400 mb-2 flex items-center gap-1.5">
              <Info className="h-3 w-3" /> AI relied on these websites
            </div>
            {topSources.length ? (
              <div className="flex flex-wrap gap-1.5">
                {topSources.map(([d, engines]) => (
                  <Tooltip key={d}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800/80 border border-gray-700 text-gray-200 hover:border-gray-600 transition-colors">
                        <Favicon domain={d} />
                        {d}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black border-gray-700 text-xs">
                      {[...engines].map(e => (
                        <div key={e} className="capitalize">Cited by {e}</div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">We don't yet have enough evidence.</div>
            )}
          </div>
        </div>

        {/* Section 4: Your gaps */}
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-[11px] uppercase tracking-wide text-red-300 mb-2 flex items-center gap-1.5">
            <XCircle className="h-3 w-3" /> Your gaps — you're missing
          </div>
          {gapAssetTypes.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gapAssetTypes.slice(0, 6).map(t => {
                const meta = ASSET_META[t];
                return (
                  <div key={t} className="flex items-center gap-2 text-sm text-gray-200 rounded bg-black/40 border border-gray-800 px-2.5 py-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{meta?.label ?? t.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-green-300">You have parity with competitor asset types on this prompt.</div>
          )}
        </div>

        {/* Section 5: Generate everything */}
        {gapAssetTypes.length > 0 && (
          <div className="rounded-lg border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <div className="text-sm font-semibold text-white">Generate everything you're missing</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {gapAssetTypes.slice(0, 6).map(t => {
                const meta = ASSET_META[t];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <Link
                    key={t}
                    to={`${meta.toolPath}?topic=${encodeURIComponent(row.prompt)}`}
                  >
                    <Button
                      size="sm"
                      className="w-full justify-between bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {meta.toolLabel}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 6: Expected result */}
        <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
          <div className="text-[11px] uppercase tracking-wide text-green-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Expected result once published
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Projection label="Visibility" from={`${proj.visFrom}%`} to={`${proj.visTo}%`} />
            <Projection label="Citations" from={String(proj.citesFrom)} to={String(proj.citesTo)} />
            <Projection label="Trusted domains" from={String(proj.domainsFrom)} to={String(proj.domainsTo)} />
          </div>
          <div className="text-[10px] text-gray-500 mt-2">
            Projections based on competitor citation footprint on this prompt.
          </div>
        </div>

        {/* Section 7: Show me why */}
        <Collapsible>
          <CollapsibleTrigger className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors py-2 border-t border-gray-800">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> How AI reached this conclusion
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <EvidenceBlock title="Competitors named" items={rankedCompetitors.length ? rankedCompetitors.map(([n, c]) => `${n} · named ${c}×`) : ['We don\'t yet have enough evidence.']} />
              <EvidenceBlock
                title="Competitor URLs cited"
                items={
                  citations.filter(c => c.cites_brand && !((c.cites_brand || '').toLowerCase().includes(brand.toLowerCase())))
                    .slice(0, 6)
                    .map(c => `${c.domain}${c.asset_type ? ` — ${ASSET_META[c.asset_type]?.label ?? c.asset_type}` : ''}`)
                    .concat(citations.length === 0 ? ['We don\'t yet have enough evidence.'] : [])
                }
              />
              <EvidenceBlock
                title="Publisher domains"
                items={
                  [...new Set(citations.map(c => c.domain))].slice(0, 8).length
                    ? [...new Set(citations.map(c => c.domain))].slice(0, 8)
                    : ['We don\'t yet have enough evidence.']
                }
              />
              <EvidenceBlock
                title="Asset types AI cited"
                items={
                  [...new Set(citations.map(c => c.asset_type).filter(Boolean))].length
                    ? [...new Set(citations.map(c => c.asset_type).filter(Boolean))].map(t => ASSET_META[t as string]?.label ?? String(t))
                    : ['We don\'t yet have enough evidence.']
                }
              />
              <EvidenceBlock
                title="Engines that answered"
                items={[
                  row.chatgpt_mentioned !== null ? `ChatGPT — ${row.chatgpt_cited ? 'cited' : row.chatgpt_mentioned ? 'mentioned' : 'silent'}` : null,
                  row.gemini_mentioned !== null ? `Gemini — ${row.gemini_cited ? 'cited' : row.gemini_mentioned ? 'mentioned' : 'silent'}` : null,
                  row.perplexity_mentioned !== null ? `Perplexity — ${row.perplexity_cited ? 'cited' : row.perplexity_mentioned ? 'mentioned' : 'silent'}` : null,
                  row.claude_mentioned !== null ? `Claude — ${row.claude_cited ? 'cited' : row.claude_mentioned ? 'mentioned' : 'silent'}` : null,
                ].filter(Boolean) as string[]}
              />
              <EvidenceBlock
                title="Confidence"
                items={[`${confidence}% — based on engine agreement and citation evidence.`]}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function Projection({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div className="rounded bg-gray-900 border border-gray-800 p-3">
      <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{from}</span>
        <ArrowRight className="h-3 w-3 text-gray-600" />
        <span className="text-lg font-bold text-green-400">{to}</span>
      </div>
    </div>
  );
}

function EvidenceBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-gray-800 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">{title}</div>
      <ul className="space-y-1 text-gray-300">
        {items.slice(0, 8).map((it, i) => (
          <li key={i} className="truncate">• {it}</li>
        ))}
      </ul>
    </div>
  );
}
