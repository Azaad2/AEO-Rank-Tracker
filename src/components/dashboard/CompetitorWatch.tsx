import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  Globe,
} from 'lucide-react';
import {
  EvidenceGrid,
  SourceChips,
  WinningPagesList,
  GapList,
  type WinningPage,
  type Gap,
} from './competitor/CompetitorEvidence';

interface CompetitorData {
  name: string;
  count: number;
  percentage: number;
  prompts: string[];
}

interface CitationRow {
  scan_result_id: number;
  url: string | null;
  domain: string | null;
  source_type: string | null;
  cites_brand: string | null;
  asset_type: string | null;
  title: string | null;
}

interface Evidence {
  comparisonPages: number;
  reviewCitations: number;
  educationalPages: number;
  referringDomains: number;
  topCitingDomains: string[];
  winningPages: WinningPage[];
  gaps: Gap[];
  hasAnyCitations: boolean;
}

const TRUSTED_SOURCE_KEYWORDS = [
  'g2', 'capterra', 'gartner', 'forrester', 'trustpilot', 'getapp', 'softwareadvice',
  'saasworthy', 'crozdesk', 'tekpon', 'producthunt', 'product-hunt',
  'forbes', 'techcrunch', 'wired', 'verge', 'cnbc', 'businessinsider', 'entrepreneur',
  'medium.com', 'substack', 'dev.to', 'hashnode',
  'reddit', 'quora', 'stackoverflow', 'hackernews', 'ycombinator',
  'youtube', 'vimeo', 'wikipedia', 'github', 'gitlab',
  'linkedin', 'twitter', 'x.com', 'facebook', 'instagram',
  'blog', 'news', 'times', 'journal', 'magazine', 'review',
];

function isTrustedSource(name: string): boolean {
  const n = (name || '').toLowerCase();
  return TRUSTED_SOURCE_KEYWORDS.some((k) => n.includes(k));
}

function normalizeBrand(s: string | null | undefined): string {
  if (!s) return '';
  return s.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

function isComparisonAsset(c: CitationRow): boolean {
  if (c.asset_type === 'comparison_page' || c.asset_type === 'listicle') return true;
  const hay = `${c.url ?? ''} ${c.title ?? ''}`.toLowerCase();
  return /\b(vs|versus|alternative|alternatives|comparison|compare|best|top\s*\d)\b/.test(hay);
}

function isReviewAsset(c: CitationRow): boolean {
  if (c.asset_type === 'review_page' || c.asset_type === 'directory_listing') return true;
  if (c.source_type && ['review', 'directory', 'publisher'].includes(c.source_type.toLowerCase())) return true;
  return isTrustedSource(c.domain ?? '');
}

function isEducationalAsset(c: CitationRow): boolean {
  return c.asset_type === 'blog_article' || c.asset_type === 'documentation_page';
}

function getDifficulty(percentage: number) {
  if (percentage >= 50) return { label: 'Hard', color: 'text-red-400 bg-red-500/10 border-red-500/30', time: '3+ months', impact: Math.round(percentage * 0.5) };
  if (percentage >= 25) return { label: 'Medium', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', time: '1-2 months', impact: Math.round(percentage * 0.6) };
  return { label: 'Easy', color: 'text-green-400 bg-green-500/10 border-green-500/30', time: '2-4 weeks', impact: Math.round(percentage * 0.7) };
}

function getFaviconUrl(name: string): string {
  const cleaned = name.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const domain = cleaned.includes('.') ? cleaned : `${cleaned}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

const ASSET_TO_TOOL: Record<string, { path: string; label: string; gapLabel: (topic: string) => string }> = {
  comparison_page: { path: '/tools/ai-blog-outline', label: 'Generate outline', gapLabel: (t) => `${t} Comparison` },
  listicle: { path: '/tools/ai-blog-outline', label: 'Generate listicle', gapLabel: (t) => `Best ${t}` },
  blog_article: { path: '/tools/ai-blog-outline', label: 'Generate guide', gapLabel: (t) => `${t} Guide` },
  documentation_page: { path: '/tools/content-auditor', label: 'Audit content', gapLabel: (t) => `${t} Documentation` },
  landing_page: { path: '/tools/description-generator', label: 'Generate copy', gapLabel: (t) => `${t} Landing Page` },
  review_page: { path: '/tools/competitor-analyzer', label: 'See who to pitch', gapLabel: (t) => `${t} Reviews` },
};

function topicFromPrompts(prompts: string[]): string {
  if (!prompts.length) return 'Your Category';
  // Take shortest prompt as topic label, trim to 3 words
  const p = [...prompts].sort((a, b) => a.length - b.length)[0];
  const words = p.replace(/[?.,!]/g, '').split(/\s+/).filter((w) => w.length > 2);
  const stop = new Set(['the', 'and', 'for', 'best', 'top', 'what', 'which', 'how', 'are', 'you', 'your', 'with']);
  const kept = words.filter((w) => !stop.has(w.toLowerCase())).slice(0, 3);
  return (kept.join(' ') || p).replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CompetitorWatch() {
  const { user } = useAuth();
  const [allBrands, setAllBrands] = useState<CompetitorData[]>([]);
  const [citations, setCitations] = useState<CitationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Record<string, { summary?: string; howToBeat: string[] }>>({});
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const [userDomain, setUserDomain] = useState<string>('');
  const [userVisibility, setUserVisibility] = useState<number>(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, [user]);

  async function fetchCompetitors() {
    if (!user) return;
    try {
      const { data: scans } = await supabase
        .from('scans')
        .select('id, project_domain, score')
        .eq('user_id', user.id);

      if (!scans || scans.length === 0) {
        setIsLoading(false);
        return;
      }

      if ((scans[0] as any)?.project_domain) setUserDomain((scans[0] as any).project_domain);
      const avgVis = scans.reduce((s, x: any) => s + (x.score || 0), 0) / scans.length;
      setUserVisibility(Math.round(avgVis));

      const scanIds = scans.map((s: any) => s.id);

      const { data: results } = await supabase
        .from('scan_results')
        .select('id, prompt, gemini_competitors, top_cited_domains')
        .in('scan_id', scanIds);

      if (!results) {
        setIsLoading(false);
        return;
      }

      setTotalPrompts(results.length);

      const resultIds = results.map((r: any) => r.id);
      let cits: CitationRow[] = [];
      if (resultIds.length > 0) {
        // Chunk to keep the IN() list under Supabase limits
        const chunkSize = 200;
        for (let i = 0; i < resultIds.length; i += chunkSize) {
          const chunk = resultIds.slice(i, i + chunkSize);
          const { data } = await supabase
            .from('citations')
            .select('scan_result_id,url,domain,source_type,cites_brand,asset_type,title')
            .in('scan_result_id', chunk);
          if (data) cits = cits.concat(data as any);
        }
      }
      setCitations(cits);

      const map = new Map<string, { count: number; prompts: Set<string> }>();
      for (const r of results) {
        const combined = [
          ...((r as any).gemini_competitors || []),
          ...((r as any).top_cited_domains || []),
        ];
        for (const raw of combined) {
          const name = String(raw).trim();
          if (!name) continue;
          const cur = map.get(name) || { count: 0, prompts: new Set<string>() };
          cur.count += 1;
          if ((r as any).prompt) cur.prompts.add((r as any).prompt);
          map.set(name, cur);
        }
      }

      const list: CompetitorData[] = Array.from(map.entries())
        .map(([name, v]) => ({
          name,
          count: v.count,
          percentage: Math.round((v.count / results.length) * 100),
          prompts: Array.from(v.prompts),
        }))
        .sort((a, b) => b.count - a.count);

      setAllBrands(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const { competitors, trustedSources } = useMemo(() => {
    const comps: CompetitorData[] = [];
    const trusted: CompetitorData[] = [];
    for (const b of allBrands) {
      if (isTrustedSource(b.name)) trusted.push(b);
      else comps.push(b);
    }
    return { competitors: comps.slice(0, 8), trustedSources: trusted.slice(0, 15) };
  }, [allBrands]);

  // Pre-compute user's own evidence stats once
  const userStats = useMemo(() => {
    const u = normalizeBrand(userDomain);
    if (!u) return { comparison: 0, review: 0, educational: 0, assets: new Set<string>() };
    const own = citations.filter((c) => normalizeBrand(c.cites_brand).includes(u));
    const cmp = new Set<string>();
    const rev = new Set<string>();
    const edu = new Set<string>();
    const assets = new Set<string>();
    for (const c of own) {
      if (c.asset_type) assets.add(c.asset_type);
      if (c.url && isComparisonAsset(c)) cmp.add(c.url);
      if (c.domain && isReviewAsset(c)) rev.add(c.domain);
      if (c.url && isEducationalAsset(c)) edu.add(c.url);
    }
    return { comparison: cmp.size, review: rev.size, educational: edu.size, assets };
  }, [citations, userDomain]);

  function buildEvidence(comp: CompetitorData): Evidence {
    const n = normalizeBrand(comp.name);
    const rows = citations.filter((c) => normalizeBrand(c.cites_brand).includes(n));

    const cmpUrls = new Set<string>();
    const revDomains = new Set<string>();
    const eduUrls = new Set<string>();
    const allDomains = new Map<string, number>();
    const pageMap = new Map<string, WinningPage>();
    const compAssets = new Set<string>();

    for (const c of rows) {
      if (c.asset_type) compAssets.add(c.asset_type);
      if (c.url && isComparisonAsset(c)) cmpUrls.add(c.url);
      if (c.domain && isReviewAsset(c)) revDomains.add(c.domain);
      if (c.url && isEducationalAsset(c)) eduUrls.add(c.url);
      if (c.domain) allDomains.set(c.domain, (allDomains.get(c.domain) ?? 0) + 1);
      if (c.url) {
        const p = pageMap.get(c.url) ?? { url: c.url, title: c.title, asset_type: c.asset_type, count: 0 };
        p.count += 1;
        if (!p.title && c.title) p.title = c.title;
        if (!p.asset_type && c.asset_type) p.asset_type = c.asset_type;
        pageMap.set(c.url, p);
      }
    }

    const topCitingDomains = [...allDomains.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([d]) => d);

    const winningPages = [...pageMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Gaps: assets they have but user doesn't
    const topic = topicFromPrompts(comp.prompts);
    const gaps: Gap[] = [];
    for (const asset of compAssets) {
      const tool = ASSET_TO_TOOL[asset];
      if (!tool) continue;
      if (userStats.assets.has(asset)) continue;
      gaps.push({
        label: tool.gapLabel(topic),
        assetType: asset,
        toolPath: tool.path,
        toolLabel: tool.label,
        topic,
      });
    }

    return {
      comparisonPages: cmpUrls.size,
      reviewCitations: revDomains.size,
      educationalPages: eduUrls.size,
      referringDomains: allDomains.size,
      topCitingDomains,
      winningPages,
      gaps: gaps.slice(0, 4),
      hasAnyCitations: rows.length > 0,
    };
  }

  async function loadStrategy(name: string) {
    if (strategies[name]) {
      setExpanded(expanded === name ? null : name);
      return;
    }
    setExpanded(name);
    setLoadingStrategy(name);
    try {
      const comp = competitors.find((c) => c.name === name);
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: {
          yourDomain: userDomain,
          competitor: name,
          promptsWhereTheyRank: comp?.prompts || [],
          mode: 'beat-strategy',
        },
      });
      if (error) throw error;
      setStrategies((p) => ({
        ...p,
        [name]: {
          summary: data?.summary,
          howToBeat: data?.howToBeat || [],
        },
      }));
    } catch {
      setStrategies((p) => ({
        ...p,
        [name]: {
          howToBeat: [
            'Publish a definitive guide targeting the queries they dominate',
            'Get listed on the top 3 review sites AI cites in your category',
            'Add FAQ and HowTo schema so AI can extract answers cleanly',
          ],
        },
      }));
    } finally {
      setLoadingStrategy(null);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (allBrands.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Brands Beating You in AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Run a scan to see which brands AI recommends instead of yours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Brands Beating You in AI
        </CardTitle>
        <p className="text-xs text-gray-400">
          Real competitors AI recommends instead of {userDomain || 'your brand'} — with the exact citations we found across {totalPrompts} prompts and {citations.length} sources.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {competitors.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No direct competitors detected yet. AI mostly cites publishers and review sites for your queries — see below.
          </p>
        )}

        {competitors.map((comp, i) => {
          const diff = getDifficulty(comp.percentage);
          const userVis = Math.max(userVisibility, 1);
          const multiplier = (comp.percentage / userVis).toFixed(1);
          const strat = strategies[comp.name];
          const isOpen = expanded === comp.name;
          const ev = buildEvidence(comp);

          return (
            <div key={comp.name} className="rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <img
                    src={getFaviconUrl(comp.name)}
                    alt=""
                    className="w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0"
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{comp.name}</h3>
                      <Badge variant="outline" className="text-[10px] bg-yellow-400/10 text-yellow-400 border-yellow-400/30">
                        #{i + 1} threat
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      AI recommends this brand{' '}
                      <span className="text-yellow-400 font-bold">{multiplier}× more often</span> than you
                      <span className="text-gray-500"> ({comp.percentage}% vs {userVisibility}%)</span>
                    </p>
                  </div>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${diff.color}`}>
                    <Zap className="h-3 w-3 inline mr-1" />
                    {diff.label} to beat
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-600 bg-gray-900 text-gray-300">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {diff.time}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +{diff.impact}% visibility
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-600 bg-gray-900 text-gray-400">
                    Wins {comp.prompts.length} of your queries
                  </span>
                </div>

                {/* Evidence Grid */}
                {ev.hasAnyCitations ? (
                  <EvidenceGrid
                    tiles={[
                      {
                        label: 'Comparison pages',
                        competitor: ev.comparisonPages,
                        you: userStats.comparison,
                        hint: 'vs / alternatives / "best" pages',
                      },
                      {
                        label: 'Review-site citations',
                        competitor: ev.reviewCitations,
                        you: userStats.review,
                        hint: 'G2, Capterra, publishers…',
                      },
                      {
                        label: 'Educational pages',
                        competitor: ev.educationalPages,
                        you: userStats.educational,
                        hint: 'guides & documentation',
                      },
                      {
                        label: 'Prompt coverage',
                        competitor: `${comp.percentage}%`,
                        you: `${userVisibility}%`,
                        hint: `of ${totalPrompts} prompts`,
                      },
                    ]}
                  />
                ) : (
                  <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs text-gray-400">
                    AI mentioned <span className="text-white font-semibold">{comp.name}</span> in{' '}
                    {comp.prompts.length} of your prompts, but we haven't crawled their citing pages yet.
                    Re-run the scan for full evidence.
                  </div>
                )}

                {/* CTA */}
                <Button
                  size="sm"
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
                  onClick={() => loadStrategy(comp.name)}
                  disabled={loadingStrategy === comp.name}
                >
                  {loadingStrategy === comp.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isOpen ? 'Hide winning strategy' : 'Show me how to beat them'}
                      {isOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </>
                  )}
                </Button>
              </div>

              {/* Expanded evidence */}
              {isOpen && (
                <div className="border-t border-gray-700 bg-gray-900/60 p-4 space-y-5 animate-in slide-in-from-top-2">
                  {strat?.summary && (
                    <p className="text-sm text-gray-200 leading-relaxed border-l-2 border-yellow-400 pl-3">
                      {strat.summary}
                    </p>
                  )}

                  {comp.prompts.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-yellow-400 flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3 w-3" /> Prompts they dominate
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {comp.prompts.slice(0, 5).map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700"
                          >
                            "{p.length > 60 ? p.slice(0, 60) + '…' : p}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <SourceChips domains={ev.topCitingDomains} />
                  <WinningPagesList pages={ev.winningPages} />
                  <GapList gaps={ev.gaps} />
                </div>
              )}
            </div>
          );
        })}

        {/* Trusted sources — collapsible */}
        {trustedSources.length > 0 && (
          <div className="rounded-xl border border-gray-700 bg-gray-800/30">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white font-medium">Trusted Industry Sources AI Uses</span>
                <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">
                  {trustedSources.length}
                </Badge>
              </div>
              {sourcesOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {sourcesOpen && (
              <div className="p-3 pt-0 space-y-2">
                <p className="text-xs text-gray-400 mb-2">
                  These are publishers, review sites and communities AI cites — not direct competitors. Getting mentioned by them is a great way to boost your visibility.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {trustedSources.map((s) => (
                    <span key={s.name} className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300">
                      {s.name} <span className="text-gray-500">· {s.percentage}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
