import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  Swords,
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  TrendingUp,
  Zap,
  BookOpen,
  Wrench,
  Sparkles,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompetitorData {
  name: string;
  count: number;
  percentage: number;
  prompts: string[];
}

interface Strategy {
  whyTheyRank: string[];
  howToBeat: string[];
  tools: { name: string; link: string }[];
}

// Domains that are publishers, review sites, communities, agencies — NOT direct competitors
const TRUSTED_SOURCE_KEYWORDS = [
  'g2', 'capterra', 'gartner', 'forrester', 'trustpilot', 'getapp', 'softwareadvice',
  'saasworthy', 'crozdesk', 'tekpon', 'producthunt', 'product-hunt',
  'forbes', 'techcrunch', 'wired', 'verge', 'cnbc', 'businessinsider', 'entrepreneur',
  'medium.com', 'substack', 'dev.to', 'hashnode',
  'reddit', 'quora', 'stackoverflow', 'hackernews', 'ycombinator',
  'youtube', 'vimeo', 'wikipedia', 'github', 'gitlab',
  'linkedin', 'twitter', 'x.com', 'facebook', 'instagram',
  'blog', 'news', 'times', 'journal', 'magazine', 'review',
  'agency', 'digital.com', 'marketing.com',
];

function isTrustedSource(name: string): boolean {
  const n = name.toLowerCase();
  return TRUSTED_SOURCE_KEYWORDS.some((k) => n.includes(k));
}

function getDifficulty(percentage: number): { label: 'Easy' | 'Medium' | 'Hard'; color: string; time: string; impact: number } {
  if (percentage >= 50) {
    return { label: 'Hard', color: 'text-red-400 bg-red-500/10 border-red-500/30', time: '3+ months', impact: Math.round(percentage * 0.5) };
  }
  if (percentage >= 25) {
    return { label: 'Medium', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', time: '1-2 months', impact: Math.round(percentage * 0.6) };
  }
  return { label: 'Easy', color: 'text-green-400 bg-green-500/10 border-green-500/30', time: '2-4 weeks', impact: Math.round(percentage * 0.7) };
}

function getFaviconUrl(name: string): string {
  // Best-effort favicon for known-domain-ish strings
  const cleaned = name.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const looksLikeDomain = cleaned.includes('.');
  const domain = looksLikeDomain ? cleaned : `${cleaned}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function defaultReasons(rank: number, percentage: number): string[] {
  const pool = [
    'Strong educational content that answers user questions directly',
    'Better comparison and alternative pages targeting your keywords',
    'More trusted citations from review sites and publishers',
    'Higher topical authority — many pages on the same subject',
    'Mentioned consistently across multiple AI models',
    'Well-structured content with clear headings and schema',
    'Long-form guides ranked by both Google and AI',
    'Active community discussions (Reddit, forums) reinforcing the brand',
  ];
  const count = percentage >= 40 ? 5 : percentage >= 20 ? 4 : 3;
  return pool.slice(rank % 3, (rank % 3) + count);
}

export function CompetitorWatch() {
  const { user } = useAuth();
  const [allBrands, setAllBrands] = useState<CompetitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Record<string, Strategy>>({});
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
        .select('id, project_domain, visibility_score')
        .eq('user_id', user.id);

      if (!scans || scans.length === 0) {
        setIsLoading(false);
        return;
      }

      if (scans[0]?.project_domain) setUserDomain(scans[0].project_domain);
      const avgVis = scans.reduce((s, x: any) => s + (x.visibility_score || 0), 0) / scans.length;
      setUserVisibility(Math.round(avgVis));

      const scanIds = scans.map((s) => s.id);

      const { data: results } = await supabase
        .from('scan_results')
        .select('prompt, gemini_competitors, top_cited_domains')
        .in('scan_id', scanIds);

      if (!results) {
        setIsLoading(false);
        return;
      }

      setTotalPrompts(results.length);

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
          whyTheyRank: data?.whyTheyRank?.length ? data.whyTheyRank : defaultReasons(0, comp?.percentage || 0),
          howToBeat: data?.howToBeat || [],
          tools: data?.tools || [{ name: 'Content Auditor', link: '/tools/content-auditor' }],
        },
      }));
    } catch {
      const comp = competitors.find((c) => c.name === name);
      setStrategies((p) => ({
        ...p,
        [name]: {
          whyTheyRank: defaultReasons(0, comp?.percentage || 0),
          howToBeat: [
            'Publish a definitive guide targeting the queries they dominate',
            'Add FAQ and HowTo schema so AI can extract answers cleanly',
            'Get listed on the top 3 review sites AI cites in your category',
            'Build 5-10 supporting posts to establish topical authority',
            'Add original data, screenshots, or benchmarks competitors lack',
          ],
          tools: [
            { name: 'Content Auditor', link: '/tools/content-auditor' },
            { name: 'FAQ Generator', link: '/tools/ai-faq-generator' },
            { name: 'Schema Generator', link: '/tools/schema-generator' },
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
          Real competitors AI recommends instead of {userDomain || 'your brand'} — based on {totalPrompts} prompts.
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
          const reasons = strat?.whyTheyRank || defaultReasons(i, comp.percentage);
          const isOpen = expanded === comp.name;

          return (
            <div key={comp.name} className="rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden">
              <div className="p-4">
                {/* Header: logo + name + rank */}
                <div className="flex items-start gap-3">
                  <img
                    src={getFaviconUrl(comp.name)}
                    alt=""
                    className="w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = 'hidden';
                    }}
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
                <div className="flex flex-wrap gap-2 mt-3">
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

                {/* Why they're winning */}
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5">Why they're winning</p>
                  <ul className="space-y-1">
                    {reasons.slice(0, isOpen ? 6 : 3).map((r, idx) => (
                      <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Button
                  size="sm"
                  className="mt-4 w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
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

              {/* Strategy panel */}
              {isOpen && strat && (
                <div className="border-t border-gray-700 bg-gray-900/60 p-4 space-y-4 animate-in slide-in-from-top-2">
                  {comp.prompts.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-yellow-400 flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3 w-3" /> Prompts they dominate
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {comp.prompts.slice(0, 5).map((p, i) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
                            "{p.length > 60 ? p.slice(0, 60) + '…' : p}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-green-400 flex items-center gap-1.5 mb-2">
                      <BookOpen className="h-3 w-3" /> Your action plan (do these in order)
                    </p>
                    <ol className="space-y-2">
                      {strat.howToBeat.map((step, idx) => (
                        <li key={idx} className="flex gap-2.5 text-sm text-gray-200">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded bg-gray-800 border border-gray-700">
                      <p className="text-[10px] uppercase text-gray-500">Estimated effort</p>
                      <p className="text-sm text-white font-semibold mt-1">{diff.time}</p>
                    </div>
                    <div className="p-3 rounded bg-gray-800 border border-green-500/30">
                      <p className="text-[10px] uppercase text-gray-500">Expected visibility gain</p>
                      <p className="text-sm text-green-400 font-semibold mt-1">+{diff.impact}%</p>
                    </div>
                  </div>

                  {strat.tools.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-blue-400 flex items-center gap-1.5 mb-2">
                        <Wrench className="h-3 w-3" /> Tools to help you execute
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {strat.tools.map((t) => (
                          <Link key={t.link} to={t.link}>
                            <Button size="sm" variant="outline" className="text-xs h-7 border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-white">
                              <Wrench className="h-3 w-3 mr-1" />
                              {t.name}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
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
