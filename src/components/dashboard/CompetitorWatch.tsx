import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Swords, ChevronDown, ChevronUp, Target, Lightbulb, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompetitorData {
  name: string;
  count: number;
  percentage: number;
}

interface Strategy {
  whyTheyRank: string[];
  howToBeat: string[];
  tools: { name: string; link: string }[];
}

export function CompetitorWatch() {
  const { user } = useAuth();
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Record<string, Strategy>>({});
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const [userDomain, setUserDomain] = useState<string>('');
  const [competitorPrompts, setCompetitorPrompts] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchCompetitors();
  }, [user]);

  async function fetchCompetitors() {
    if (!user) return;
    try {
      const { data: scans, error: scanError } = await supabase
        .from('scans')
        .select('id, project_domain')
        .eq('user_id', user.id);

      if (scanError) throw scanError;
      if (!scans || scans.length === 0) {
        setIsLoading(false);
        return;
      }

      if (scans[0]?.project_domain) {
        setUserDomain(scans[0].project_domain);
      }

      const scanIds = scans.map(s => s.id);

      const { data: results, error: resultsError } = await supabase
        .from('scan_results')
        .select('gemini_competitors, top_cited_domains')
        .in('scan_id', scanIds);

      if (resultsError) throw resultsError;
      if (!results) {
        setIsLoading(false);
        return;
      }

      setTotalPrompts(results.length);

      // Also fetch prompts to know which queries each competitor appears in
      const { data: resultsWithPrompts } = await supabase
        .from('scan_results')
        .select('prompt, gemini_competitors, top_cited_domains')
        .in('scan_id', scanIds);

      const competitorMap = new Map<string, number>();
      const promptsMap: Record<string, string[]> = {};
      for (const result of (resultsWithPrompts || results)) {
        const allCompetitors = [
          ...(result.gemini_competitors || []),
          ...(result.top_cited_domains || []),
        ];
        for (const c of allCompetitors) {
          const name = c.trim();
          if (name) {
            competitorMap.set(name, (competitorMap.get(name) || 0) + 1);
            if (!promptsMap[name]) promptsMap[name] = [];
            if ((result as any).prompt && !promptsMap[name].includes((result as any).prompt)) {
              promptsMap[name].push((result as any).prompt);
            }
          }
        }
      }

      setCompetitorPrompts(promptsMap);

      const sorted = Array.from(competitorMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / results.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setCompetitors(sorted);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBeat(competitorName: string) {
    // If already cached, just toggle
    if (strategies[competitorName]) {
      setExpandedCompetitor(expandedCompetitor === competitorName ? null : competitorName);
      return;
    }

    setExpandedCompetitor(competitorName);
    setLoadingStrategy(competitorName);

    try {
      const promptsForCompetitor = competitorPrompts[competitorName] || [];
      
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: {
          yourDomain: userDomain,
          competitor: competitorName,
          promptsWhereTheyRank: promptsForCompetitor,
          mode: 'beat-strategy',
        },
      });

      if (error) throw error;

      // Parse the structured JSON response from AI
      const strategy: Strategy = {
        whyTheyRank: data?.whyTheyRank || ['Analysis unavailable'],
        howToBeat: data?.howToBeat || ['Analysis unavailable'],
        tools: data?.tools || [{ name: 'Content Auditor', link: '/tools/content-auditor' }],
      };
      
      setStrategies(prev => ({ ...prev, [competitorName]: strategy }));
    } catch (err) {
      console.error('Strategy generation failed:', err);
      // Provide fallback strategy based on competitor data
      const fallbackStrategy: Strategy = {
        whyTheyRank: [
          `${competitorName} appears in ${competitors.find(c => c.name === competitorName)?.percentage || 0}% of AI answers for your queries`,
          'They likely have comprehensive, well-structured content on these topics',
          'Their domain authority and content depth make them a preferred AI source',
        ],
        howToBeat: [
          'Create more in-depth, factual content covering the same topics',
          'Add structured data (FAQ schema, HowTo schema) to your pages',
          'Build topical authority with a cluster of related content pieces',
          'Ensure your content answers questions directly and concisely',
          'Add unique data, case studies, or original research that competitors lack',
        ],
        tools: [
          { name: 'Content Auditor', link: '/tools/content-auditor' },
          { name: 'FAQ Generator', link: '/tools/ai-faq-generator' },
          { name: 'Schema Generator', link: '/tools/schema-generator' },
          { name: 'Blog Outline', link: '/tools/ai-blog-outline' },
        ],
      };
      setStrategies(prev => ({ ...prev, [competitorName]: fallbackStrategy }));
    } finally {
      setLoadingStrategy(null);
    }
  }

  // parseStrategy removed - now using direct JSON response from AI

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (competitors.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Swords className="h-5 w-5 text-yellow-400" />
            Competitor Watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Run scans to see which competitors appear most frequently in AI answers for your queries.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Swords className="h-5 w-5 text-yellow-400" />
          Competitor Watch
        </CardTitle>
        <p className="text-xs text-gray-400">
          Based on {totalPrompts} prompts across your scans
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {competitors.map((comp, i) => (
          <div key={comp.name}>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <span className="text-lg font-bold text-gray-500 w-6 text-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium truncate">{comp.name}</p>
                  <Badge variant="outline" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600">
                    {comp.count}x
                  </Badge>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-yellow-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(comp.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-yellow-400 hover:text-yellow-300 text-xs"
                onClick={() => handleBeat(comp.name)}
                disabled={loadingStrategy === comp.name}
              >
                {loadingStrategy === comp.name ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Swords className="h-3 w-3 mr-1" />
                    Beat
                    {expandedCompetitor === comp.name ? (
                      <ChevronUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </>
                )}
              </Button>
            </div>

            {/* Expandable Strategy Panel — Visual Data Graph */}
            {expandedCompetitor === comp.name && strategies[comp.name] && (
              <div className="mt-2 ml-9 p-4 rounded-lg bg-gray-800 border border-gray-700 space-y-5 animate-in slide-in-from-top-2">
                {/* Head-to-head visibility bar */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Visibility Head-to-Head
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400 truncate max-w-[60%]">{comp.name}</span>
                        <span className="text-red-400 font-bold">{comp.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full"
                          style={{ width: `${Math.min(comp.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-yellow-400 truncate max-w-[60%]">{userDomain || 'You'}</span>
                        <span className="text-yellow-400 font-bold">0%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full" style={{ width: '2%' }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Gap: <span className="text-red-400 font-semibold">−{comp.percentage} pts</span> across {competitorPrompts[comp.name]?.length || 0} shared queries
                    </p>
                  </div>
                </div>

                {/* Why They Rank — factor cards */}
                <div>
                  <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Target className="h-3.5 w-3.5" />
                    Ranking Factors
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {strategies[comp.name].whyTheyRank.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-gray-900/60 border border-yellow-400/20">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center">
                          F{idx + 1}
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How to Beat — flow diagram */}
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Action Flow to Outrank
                  </h4>
                  <div className="relative pl-6 space-y-2">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-green-500 via-green-500/50 to-transparent" />
                    {strategies[comp.name].howToBeat.map((step, idx, arr) => (
                      <div key={idx} className="relative flex items-start gap-3">
                        <span className="absolute -left-6 flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center ring-2 ring-gray-800">
                          {idx + 1}
                        </span>
                        <div className="flex-1 p-2 rounded bg-gray-900/60 border border-green-500/20 ml-1">
                          <p className="text-xs text-gray-300 leading-relaxed">{step}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-green-400 uppercase font-semibold">
                              Step {idx + 1} of {arr.length}
                            </span>
                            <div className="flex-1 h-0.5 bg-gray-700 rounded overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${((idx + 1) / arr.length) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Wrench className="h-3.5 w-3.5" />
                    Deploy These Tools
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {strategies[comp.name].tools.map((tool) => (
                      <Link key={tool.link} to={tool.link}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-white h-7"
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          {tool.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
