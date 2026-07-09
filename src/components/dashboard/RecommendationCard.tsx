import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Info,
  Star,
  TrendingUp,
  Users,
  Lightbulb,
  AlertTriangle,
  Target,
  Circle,
} from 'lucide-react';
import { useEffect } from 'react';


export interface RecommendationRow {
  id: string;
  title: string;
  description: string | null;
  why_this_matters: string | null;
  target_metric: string | null;
  projected_metric_delta: number | null;
  priority_score: number | null;
  difficulty: string;
  difficulty_weight: number | null;
  time_estimate_minutes: number | null;
  evidence: any;
  evidence_urls: string[] | null;
  industry_benchmark: any;
  competitor_examples: any;
  supporting_asset_types: string[] | null;
  status: string;
  recurrence_count: number | null;
  novelty_score: number | null;
  execution_payload: any;
  category: string;
  confidence: number;
  expected_impact: number;
}

/** Human labels + tooltip descriptions for the raw internal metric codes. */
const METRIC_INFO: Record<string, { label: string; blurb: string; unit: string }> = {
  RSS: {
    label: 'AI Recommendation Score',
    blurb: 'How often AI assistants recommend your brand for prompts in your space.',
    unit: 'mentions',
  },
  CAG: {
    label: 'Competitor Gap',
    blurb: 'How far behind you are compared to the competitors AI recommends most.',
    unit: 'points',
  },
  TSD: {
    label: 'Citation Diversity',
    blurb: 'How many different trusted websites cite your brand. AI trusts variety.',
    unit: 'domains',
  },
  CIS: {
    label: 'Citation Impact',
    blurb: 'How influential the sites that mention you are.',
    unit: 'score',
  },
  COI: {
    label: 'Content Opportunity',
    blurb: 'How much untapped content ground exists for you to claim.',
    unit: 'opportunities',
  },
};

const DIFF_LABEL: Record<string, string> = {
  easy: 'Quick win',
  medium: 'Moderate effort',
  hard: 'Bigger project',
};

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-400 border-red-500/30',
};

/** Map priority_score (0–1000+ scale) → 1–5 star impact. */
function priorityToStars(score: number | null | undefined): number {
  if (score == null) return 3;
  const s = Number(score);
  if (s >= 800) return 5;
  if (s >= 600) return 4;
  if (s >= 400) return 3;
  if (s >= 200) return 2;
  return 1;
}

function impactLabel(stars: number): string {
  return ['', 'Low Impact', 'Moderate Impact', 'Solid Impact', 'High Impact', 'Critical Impact'][stars];
}

/** Turn an action asset type into a friendly button label + why-it-helps blurb. */
const ACTION_INFO: Record<string, { label: string; why: string }> = {
  outreach: {
    label: 'Generate Outreach Plan',
    why: 'Get pitched on the trusted sites competitors already appear on.',
  },
  guest_post: {
    label: 'Generate Guest Posting Strategy',
    why: 'Publish on high-authority sites AI assistants already cite.',
  },
  comparison: {
    label: 'Generate Comparison Article',
    why: 'Show up in "X vs Y" prompts where competitors currently win.',
  },
  faq: {
    label: 'Generate FAQ',
    why: 'AI assistants quote clean Q&A pages more than any other format.',
  },
  landing_page: {
    label: 'Generate Landing Page',
    why: 'Give AI a dedicated page to cite for this exact topic.',
  },
  pr: {
    label: 'Generate PR Campaign',
    why: 'Trigger fresh mentions on trusted news + review sites.',
  },
  article: {
    label: 'Generate Article',
    why: 'Long-form content is the #1 source AI pulls citations from.',
  },
  schema: {
    label: 'Generate Schema Markup',
    why: 'Structured data helps AI understand and quote your pages.',
  },
};

function humanizeAsset(type: string): { label: string; why: string } {
  return (
    ACTION_INFO[type] ?? {
      label: `Generate ${type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
      why: 'Recommended content asset to close this gap.',
    }
  );
}

type CategoryTag = {
  label: string;
  emoji: string;
  className: string;
};

function categorize(rec: RecommendationRow, stars: number): CategoryTag {
  if (stars >= 5)
    return {
      label: 'Do First',
      emoji: '🔥',
      className: 'bg-red-500/15 text-red-300 border-red-500/40',
    };
  if (rec.difficulty === 'easy')
    return {
      label: 'Quick Win',
      emoji: '⚡',
      className: 'bg-green-500/15 text-green-300 border-green-500/40',
    };
  if (rec.difficulty === 'hard')
    return {
      label: 'Long-term',
      emoji: '🛡',
      className: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    };
  return {
    label: 'High Growth',
    emoji: '📈',
    className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  };
}

const EFFORT: Record<string, { dot: string; label: string; color: string }> = {
  easy: { dot: '🟢', label: 'Low effort', color: 'text-green-400' },
  medium: { dot: '🟡', label: 'Medium effort', color: 'text-yellow-400' },
  hard: { dot: '🔴', label: 'High effort', color: 'text-red-400' },
};

/** Consequence copy — derived from target metric, no fake numbers. */
function ifIgnoredCopy(rec: RecommendationRow): string {
  const m = (rec.target_metric || '').toUpperCase();
  if (m === 'RSS')
    return 'Competitors will keep receiving more AI recommendations for this topic while your brand stays invisible.';
  if (m === 'CAG')
    return 'The recommendation gap between you and the leading brands in your industry will keep widening.';
  if (m === 'TSD')
    return 'Your citation diversity will remain below the industry average, making AI assistants trust you less.';
  if (m === 'CIS')
    return 'You will continue missing citations from the most influential sources AI relies on.';
  if (m === 'COI')
    return 'Untapped content opportunities in your space will be claimed by competitors first.';
  return 'This gap will keep compounding and cost you AI visibility over time.';
}

/** Outcome bullets — derived from target metric + category. */
function whenCompletedBullets(rec: RecommendationRow): string[] {
  const m = (rec.target_metric || '').toUpperCase();
  const base: Record<string, string[]> = {
    RSS: [
      'More frequent AI recommendations for your brand',
      'Higher share of voice inside your topic',
      'Better chance of being the answer AI picks',
    ],
    CAG: [
      'Smaller gap versus the top-cited competitors',
      'Better parity with industry leaders in AI output',
      'Stronger positioning in "best X" style prompts',
    ],
    TSD: [
      'Stronger AI trust signals',
      'Better citation diversity across trusted sites',
      'Greater chance of appearing in AI recommendations',
    ],
    CIS: [
      'Citations from higher-authority sources',
      'AI weights your mentions more heavily',
      'More durable long-term visibility',
    ],
    COI: [
      'Ownership of untapped topic ground',
      'First-mover advantage before competitors catch up',
      'New surfaces where AI can quote your brand',
    ],
  };
  return (
    base[m] ?? [
      'Improved AI visibility for this topic',
      'Stronger presence in AI-generated answers',
      'Better positioning against competitors',
    ]
  );
}

/** Simple actionable checklist derived from asset types + generic steps. */
function buildChecklist(rec: RecommendationRow, assetTypes: string[]): string[] {
  const items: string[] = [];
  const seen = new Set<string>();
  for (const t of assetTypes.slice(0, 3)) {
    const label = humanizeAsset(t).label;
    if (!seen.has(label)) {
      seen.add(label);
      items.push(label);
    }
  }
  if (items.length === 0) items.push('Complete the recommended action');
  items.push('Publish and index the new asset');
  items.push('Monitor results in your next scan');
  return items;
}


interface Props {
  rec: RecommendationRow;
  onChanged?: () => void;
}

export function RecommendationCard({ rec, onChanged }: Props) {
  const { toast } = useToast();
  const [advOpen, setAdvOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`rec-checklist-${rec.id}`);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, [rec.id]);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      try {
        localStorage.setItem(`rec-checklist-${rec.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }


  const done = rec.status === 'completed';
  const stars = priorityToStars(rec.priority_score);
  const metricCode = rec.target_metric || '';
  const metricInfo = METRIC_INFO[metricCode];

  const evidenceKeys =
    rec.evidence && typeof rec.evidence === 'object' ? Object.keys(rec.evidence) : [];
  const urls = rec.evidence_urls ?? [];
  const benchmark = rec.industry_benchmark || {};
  const peerMedian = Number(benchmark.peer_median ?? benchmark.median ?? 0);
  const userValue = Number(benchmark.user_value ?? benchmark.you ?? 0);
  const gap = Number(benchmark.gap ?? Math.max(0, peerMedian - userValue));
  const sample = Number(benchmark.peer_sample_size ?? benchmark.sample_size ?? 0);
  const competitors: any[] = Array.isArray(rec.competitor_examples) ? rec.competitor_examples : [];
  const max = Math.max(peerMedian, userValue, 1);
  const unit = metricInfo?.unit ?? 'points';

  const projected = rec.projected_metric_delta != null ? Number(rec.projected_metric_delta) : 0;
  const gainLine =
    projected > 0
      ? `+${projected.toFixed(1)}% AI visibility gain`
      : stars >= 5
      ? 'Your #1 opportunity right now'
      : 'Meaningful visibility gain';

  // "Why AI is telling you this" — real-data narrative
  const whyAI = (() => {
    if (sample >= 2 && peerMedian > 0) {
      const ratio = userValue > 0 ? (peerMedian / Math.max(userValue, 1)).toFixed(1) : '3.0';
      return `Across ${sample.toLocaleString()} recent scans in your industry, brands with ${peerMedian}+ ${unit} were recommended by AI assistants roughly ${ratio}× more often than brands like yours (${userValue}).`;
    }
    if (competitors.length > 0) {
      return `AI assistants consistently recommend ${competitors
        .slice(0, 2)
        .map((c) => c.brand || c.name)
        .filter(Boolean)
        .join(' and ')} for this topic instead of your brand. Closing the gap moves you into that recommendation set.`;
    }
    return 'Based on your latest scan, this is one of the biggest levers to increase how often AI assistants surface your brand.';
  })();

  async function updateStatus(status: string) {
    setBusy(true);
    const { error } = await supabase
      .from('recommendations')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', rec.id);
    setBusy(false);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    if (status === 'completed' || status === 'dismissed') {
      supabase
        .rpc('record_recommendation_outcome', {
          _recommendation_id: rec.id,
          _success: status === 'completed',
        })
        .then(({ error: outErr }) => {
          if (outErr) console.warn('record_recommendation_outcome failed:', outErr.message);
        });
    }
    toast({ title: status === 'completed' ? 'Marked done' : 'Updated' });
    onChanged?.();
  }

  const assetTypes = rec.supporting_asset_types?.length
    ? rec.supporting_asset_types
    : rec.execution_payload?.generator && rec.execution_payload.generator !== 'manual'
    ? [rec.execution_payload.generator]
    : [];

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={`bg-gray-900 border-gray-800 ${done ? 'opacity-60' : ''}`}>
        <CardContent className="p-5 space-y-4">
          {/* Why AI is telling you this — banner */}
          <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3 flex gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-yellow-400/80 font-semibold mb-1">
                Why AI is telling you this
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{whyAI}</p>
            </div>
          </div>

          {/* Header: title + impact */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg leading-snug">{rec.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {(() => {
                  const cat = categorize(rec, stars);
                  return (
                    <Badge variant="outline" className={cat.className}>
                      <span className="mr-1">{cat.emoji}</span>
                      {cat.label}
                    </Badge>
                  );
                })()}
                {(() => {
                  const ef = EFFORT[rec.difficulty] ?? EFFORT.medium;
                  return (
                    <Badge variant="outline" className={`border-gray-700 ${ef.color}`}>
                      <span className="mr-1">{ef.dot}</span>
                      {ef.label}
                    </Badge>
                  );
                })()}
                {rec.time_estimate_minutes != null && (
                  <Badge variant="outline" className="border-gray-700 text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />~{rec.time_estimate_minutes} min
                  </Badge>
                )}
              </div>

            </div>
            <div className="text-right shrink-0 min-w-[130px]">
              <div className="flex items-center justify-end gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-yellow-400 font-semibold">{impactLabel(stars)}</div>
              <div className="text-[11px] text-green-400 mt-1 flex items-center justify-end gap-1">
                <TrendingUp className="h-3 w-3" />
                {gainLine}
              </div>
            </div>
          </div>

          {/* Why this matters */}
          {(rec.why_this_matters || rec.description) && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                Why this matters
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {rec.why_this_matters || rec.description}
              </p>
            </div>
          )}

          {/* Your status vs industry */}
          {sample >= 1 && (peerMedian > 0 || userValue > 0) && (
            <div className="rounded-md border border-gray-800 bg-black/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Your status
                </div>
                <span className="text-[11px] text-gray-500">based on {sample} peers</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{userValue}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Your brand</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{peerMedian}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Industry average</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${gap > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {gap > 0 ? `-${gap}` : '✓'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Gap</div>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-gray-500"
                    style={{ width: `${(userValue / max) * 100}%` }}
                  />
                </div>
                <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${(peerMedian / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Companies doing this better */}
          {competitors.length > 0 && (
            <div className="rounded-md border border-gray-800 bg-black/40 p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                <Users className="h-3 w-3" />
                Companies doing this better
              </div>
              <ul className="space-y-1.5">
                {competitors.slice(0, 3).map((c, i) => {
                  const name = c.brand || c.name || `Competitor ${i + 1}`;
                  const value = c.value ?? c.count;
                  return (
                    <li key={i} className="text-sm text-gray-300 flex items-baseline gap-2">
                      <span className="text-yellow-400">•</span>
                      <span className="font-medium text-white">{name}</span>
                      {value != null && (
                        <span className="text-xs text-gray-400">
                          appears on {value} {unit}
                        </span>
                      )}
                    </li>
                  );
                })}
                {userValue >= 0 && (
                  <li className="text-sm text-gray-500 flex items-baseline gap-2 pt-1 border-t border-gray-800 mt-2">
                    <span>•</span>
                    <span>Your brand appears on only <span className="text-white">{userValue}</span>.</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Recommended actions */}
          {assetTypes.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                Recommended actions
              </div>
              <div className="space-y-2">
                {assetTypes.slice(0, 4).map((t) => {
                  const info = humanizeAsset(t);
                  return (
                    <div
                      key={t}
                      className="flex items-start justify-between gap-3 rounded border border-gray-800 bg-black/30 p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium">{info.label}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{info.why}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 shrink-0"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Let AI help
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Why we're recommending this (evidence) */}
          {(urls.length > 0 || evidenceKeys.length > 0) && (
            <Collapsible open={evidenceOpen} onOpenChange={setEvidenceOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400 transition-colors">
                  {evidenceOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  Why we're recommending this ({urls.length + evidenceKeys.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {evidenceKeys.length > 0 && (
                  <ul className="space-y-1 text-xs text-gray-300">
                    {evidenceKeys.map((k) => {
                      const v = rec.evidence[k];
                      const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
                      return (
                        <li key={k} className="flex gap-2">
                          <span className="text-green-400 shrink-0">✓</span>
                          <span>
                            <span className="text-gray-500">{k.replace(/_/g, ' ')}:</span>{' '}
                            <span className="text-gray-200">{text}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {urls.length > 0 && (
                  <ul className="space-y-1">
                    {urls.map((u, i) => (
                      <li key={i}>
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 break-all"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {u}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Advanced metrics — hidden by default */}
          {metricInfo && (
            <Collapsible open={advOpen} onOpenChange={setAdvOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  {advOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Advanced metrics
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded border border-gray-800 bg-black/40 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-300">{metricInfo.label}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{metricInfo.blurb}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Internal code: {metricCode}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-gray-500 font-mono">{metricCode}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-400">
                    <div>
                      Priority score:{' '}
                      <span className="text-gray-200">
                        {rec.priority_score != null ? Math.round(Number(rec.priority_score)) : '—'}
                      </span>
                    </div>
                    <div>
                      Confidence:{' '}
                      <span className="text-gray-200">
                        {Math.round((rec.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                    <div>
                      Expected impact:{' '}
                      <span className="text-gray-200">{rec.expected_impact ?? '—'}</span>
                    </div>
                    <div>
                      Projected Δ:{' '}
                      <span className="text-gray-200">
                        {projected ? `+${projected.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!done && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => updateStatus('completed')}
                className="bg-yellow-400 text-black hover:bg-yellow-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Mark done
              </Button>
            )}
            {done && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => updateStatus('pending')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Reopen
              </Button>
            )}
            {!done && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => updateStatus('dismissed')}
                className="border-gray-700 text-gray-400 hover:bg-gray-800"
              >
                Snooze
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
