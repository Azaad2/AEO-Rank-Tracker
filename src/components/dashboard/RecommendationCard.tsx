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
    label: 'How often AI mentions you',
    blurb: 'How often AI assistants like ChatGPT recommend your brand when people ask about your space.',
    unit: 'mentions',
  },
  CAG: {
    label: 'Gap vs. competitors',
    blurb: 'How far behind you are compared to the brands AI recommends most.',
    unit: 'points',
  },
  TSD: {
    label: 'Websites talking about you',
    blurb: 'How many different trusted websites mention your brand. More variety = more trust from AI.',
    unit: 'websites',
  },
  CIS: {
    label: 'Quality of mentions',
    blurb: 'How trusted and well-known the websites mentioning you are.',
    unit: 'score',
  },
  COI: {
    label: 'Untapped opportunities',
    blurb: 'How much room there is to grow before competitors take it.',
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
  return ['', 'Small boost', 'Nice boost', 'Strong boost', 'Big boost', 'Game changer'][stars];
}

/** Turn an action asset type into a friendly button label + what-it-does blurb. */
const ACTION_INFO: Record<string, { label: string; why: string; how: string }> = {
  outreach: {
    label: 'Pitch your brand to trusted websites',
    why: 'Get featured on the websites AI already trusts and quotes.',
    how: "We'll draft a short email you can send to 5–10 relevant websites asking them to mention or link to you.",
  },
  guest_post: {
    label: 'Write a guest article for a popular site',
    why: 'Publishing on sites AI already reads is the fastest way to get quoted.',
    how: "We'll suggest topics and target sites that accept guest posts in your industry.",
  },
  comparison: {
    label: 'Write a "You vs. Competitor" article',
    why: 'Wins searches like "best X" or "X vs Y" where AI currently picks your competitor.',
    how: "We'll draft a fair, structured comparison page you can publish on your site.",
  },
  faq: {
    label: 'Add an FAQ page to your site',
    why: 'AI loves plain question-and-answer pages and quotes them more than any other format.',
    how: "We'll generate 8–12 real questions people ask about your space, with short answers.",
  },
  landing_page: {
    label: 'Build a page about this exact topic',
    why: 'Gives AI a clear page to point to when someone asks about this.',
    how: "We'll draft the page structure, headline, and copy for you to publish.",
  },
  pr: {
    label: 'Run a small PR / news push',
    why: 'News and review sites are the sources AI trusts most.',
    how: "We'll draft a press-style announcement and a list of relevant reporters to send it to.",
  },
  article: {
    label: 'Write a helpful blog article',
    why: 'Long, useful articles are the #1 source AI pulls answers from.',
    how: "We'll suggest a title, outline, and key sections based on what AI already rewards in your space.",
  },
  schema: {
    label: 'Add hidden AI-friendly tags to your page',
    why: 'Small technical tags help AI understand your page and quote it correctly.',
    how: "We'll generate the exact code snippet — you paste it into your site's <head>.",
  },
  review: {
    label: 'Get listed on a review site',
    why: 'Review sites like G2, Capterra, and Trustpilot are heavily quoted by AI.',
    how: "We'll show you which review sites your competitors are on that you're missing.",
  },
  reddit_thread: {
    label: 'Start a Reddit discussion',
    why: 'Reddit threads show up constantly in AI answers because AI treats them as real user opinions.',
    how: "We'll suggest a subreddit and draft an honest post — not spam — that mentions your brand naturally.",
  },
  listicle: {
    label: 'Get added to a "Top 10" list article',
    why: 'When AI is asked "what are the best X", it usually reads these list articles first.',
    how: "We'll find existing list articles in your space and draft an email asking to be added.",
  },
  video: {
    label: 'Publish a short YouTube video',
    why: 'AI increasingly pulls answers from YouTube transcripts.',
    how: "We'll suggest a video topic and script outline you can film in under 10 minutes.",
  },
  podcast: {
    label: 'Get on a podcast in your space',
    why: 'Podcast transcripts get quoted by AI when people ask expert questions.',
    how: "We'll suggest podcasts that match your niche and draft an intro pitch.",
  },
  case_study: {
    label: 'Publish a customer case study',
    why: 'Real results and numbers get quoted by AI as proof.',
    how: "We'll give you a simple template — problem, solution, result — to fill in with a customer.",
  },
  directory: {
    label: 'Add your brand to industry directories',
    why: 'Directories are trusted lists AI checks when looking up brands.',
    how: "We'll show you the top directories in your space and how to submit.",
  },
  press_release: {
    label: 'Publish a press release',
    why: 'Press releases spread your name across news sites AI trusts.',
    how: "We'll draft a short release around a recent update, launch, or milestone.",
  },
  testimonial: {
    label: 'Collect and publish customer testimonials',
    why: 'Testimonials with real names and results boost the trust AI assigns to your brand.',
    how: "We'll draft a short email you can send to 3–5 happy customers to collect quotes.",
  },
  tutorial: {
    label: 'Write a step-by-step tutorial',
    why: 'How-to content is one of the most-quoted formats in AI answers.',
    how: "We'll draft a step-by-step guide around a common problem your customers have.",
  },
  guide: {
    label: 'Write an in-depth guide',
    why: 'Deep guides get quoted by AI as the authoritative source on a topic.',
    how: "We'll draft an outline covering the questions AI actually gets asked about this.",
  },
};

function humanizeAsset(type: string): { label: string; why: string; how: string } {
  if (ACTION_INFO[type]) return ACTION_INFO[type];
  const nice = type.replace(/_/g, ' ').toLowerCase();
  return {
    label: `Create a ${nice}`,
    why: `Publishing a ${nice} on this topic gives AI another trusted place to quote your brand from.`,
    how: `We'll help you plan and draft the ${nice} step by step.`,
  };
}

/** Rewrite jargon-y titles from the backend into plain English. */
function humanizeTitle(title: string): string {
  const rules: Array<[RegExp, string]> = [
    [/diversify your trusted source mix/i, 'Get mentioned on more different websites'],
    [/trusted source diversity/i, 'variety of websites talking about you'],
    [/increase (your )?rss/i, 'Get AI to mention you more often'],
    [/reduce (your )?cag/i, 'Close the gap with your top competitors'],
    [/improve (your )?tsd/i, 'Get on more different websites'],
    [/improve (your )?cis/i, 'Get mentioned on more trusted websites'],
    [/improve (your )?coi/i, 'Grab untapped topics before competitors do'],
  ];
  let out = title;
  for (const [rx, rep] of rules) out = out.replace(rx, rep);
  return out;
}

/** Rewrite metric jargon inside description/why text. */
function humanizeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bRSS\b/g, 'AI mentions')
    .replace(/\bCAG\b/g, 'gap vs competitors')
    .replace(/\bTSD\b/g, 'website variety')
    .replace(/\bCIS\b/g, 'mention quality')
    .replace(/\bCOI\b/g, 'untapped opportunities')
    .replace(/Recommendation Strength/gi, 'how often AI picks you')
    .replace(/distinct trusted domains/gi, 'different trusted websites');
}

type CategoryTag = {
  label: string;
  emoji: string;
  className: string;
};

function categorize(rec: RecommendationRow, stars: number): CategoryTag {
  if (stars >= 5)
    return {
      label: 'Do this first',
      emoji: '🔥',
      className: 'bg-red-500/15 text-red-300 border-red-500/40',
    };
  if (rec.difficulty === 'easy')
    return {
      label: 'Quick win',
      emoji: '⚡',
      className: 'bg-green-500/15 text-green-300 border-green-500/40',
    };
  if (rec.difficulty === 'hard')
    return {
      label: 'Bigger project',
      emoji: '🛡',
      className: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    };
  return {
    label: 'Good growth bet',
    emoji: '📈',
    className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  };
}

const EFFORT: Record<string, { dot: string; label: string; color: string }> = {
  easy: { dot: '🟢', label: 'Easy', color: 'text-green-400' },
  medium: { dot: '🟡', label: 'Some work', color: 'text-yellow-400' },
  hard: { dot: '🔴', label: 'Takes real work', color: 'text-red-400' },
};

/** Consequence copy — derived from target metric, no fake numbers. */
function ifIgnoredCopy(rec: RecommendationRow): string {
  const m = (rec.target_metric || '').toUpperCase();
  if (m === 'RSS')
    return 'Your competitors will keep showing up when people ask AI about your space — and your brand will stay invisible.';
  if (m === 'CAG')
    return 'The gap between you and the top brands in your industry will keep growing.';
  if (m === 'TSD')
    return 'AI will trust you less than your competitors because fewer websites talk about you.';
  if (m === 'CIS')
    return 'You\'ll keep missing mentions on the most trusted websites AI relies on.';
  if (m === 'COI')
    return 'Competitors will grab these topics before you get a chance.';
  return 'This problem will grow over time and cost you real visibility.';
}

/** Outcome bullets — derived from target metric + category. */
function whenCompletedBullets(rec: RecommendationRow): string[] {
  const m = (rec.target_metric || '').toUpperCase();
  const base: Record<string, string[]> = {
    RSS: [
      'AI will start recommending your brand more often',
      'You\'ll show up in more customer questions',
      'Better chance of being the answer AI picks',
    ],
    CAG: [
      'You catch up to the top brands in your space',
      'You\'ll appear next to the leaders in AI answers',
      'You start winning "best X" type questions',
    ],
    TSD: [
      'AI will start trusting your brand more',
      'You get mentioned on a wider mix of websites',
      'Higher chance of showing up in AI answers',
    ],
    CIS: [
      'You get mentions on more trusted websites',
      'AI takes your brand more seriously',
      'Your visibility lasts longer over time',
    ],
    COI: [
      'You own topics before competitors do',
      'First-mover advantage in your space',
      'New places where AI can quote your brand',
    ],
  };
  return (
    base[m] ?? [
      'More AI visibility on this topic',
      'You show up more in AI answers',
      'You look stronger vs. your competitors',
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
  if (items.length === 0) items.push('Do the suggested action');
  items.push('Publish it on your website');
  items.push('Check your next scan to see the results');
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
      ? `+${projected.toFixed(1)}% more AI visibility`
      : stars >= 5
      ? 'Your biggest opportunity right now'
      : 'Real boost to your visibility';

  // "Why AI is telling you this" — real-data narrative
  const whyAI = (() => {
    if (sample >= 2 && peerMedian > 0) {
      const ratio = userValue > 0 ? (peerMedian / Math.max(userValue, 1)).toFixed(1) : '3.0';
      return `We looked at ${sample.toLocaleString()} recent brands in your industry. The ones with ${peerMedian}+ ${unit} get recommended by AI about ${ratio}× more often than your brand (${userValue}).`;
    }
    if (competitors.length > 0) {
      return `AI keeps recommending ${competitors
        .slice(0, 2)
        .map((c) => c.brand || c.name)
        .filter(Boolean)
        .join(' and ')} for this topic instead of you. Fixing this puts your brand in the same conversation.`;
    }
    return 'Based on your latest scan, this is one of the fastest ways to get AI to start recommending your brand more.';
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
                Why we're suggesting this
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{whyAI}</p>
            </div>
          </div>

          {/* Header: title + impact */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg leading-snug">{humanizeTitle(rec.title)}</h3>
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
                    <Clock className="h-3 w-3 mr-1" />About {rec.time_estimate_minutes} min
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
                Why this matters for your business
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {rec.why_this_matters || rec.description}
              </p>
            </div>
          )}

          {/* Your status vs industry — visual comparison */}
          {sample >= 2 && (peerMedian > 0 || userValue > 0) ? (
            <div className="rounded-md border border-gray-800 bg-black/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  You vs. others in your industry
                </div>
                <span className="text-[11px] text-gray-500">from {sample} similar brands</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">You</span>
                    <span className="text-white font-medium">{userValue}</span>
                  </div>
                  <div className="h-2.5 bg-gray-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-gray-500 transition-all"
                      style={{ width: `${Math.max(4, (userValue / max) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-yellow-400/80">Typical brand in your space</span>
                    <span className="text-yellow-400 font-medium">{peerMedian}</span>
                  </div>
                  <div className="h-2.5 bg-gray-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${Math.max(4, (peerMedian / max) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              {gap > 0 && (
                <div className="text-[11px] text-red-300">
                  You're behind by <span className="font-semibold">{gap}</span> {unit}.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-gray-800 bg-black/30 p-3 text-xs text-gray-400">
              We're still gathering enough industry data to compare you here.
            </div>
          )}

          {/* If you ignore this */}
          <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-red-300/90 font-semibold mb-1">
                What happens if you skip this
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{ifIgnoredCopy(rec)}</p>
            </div>
          </div>

          {/* When completed */}
          <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3 flex gap-2">
            <Target className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-green-300/90 font-semibold mb-1">
                What you get once it's done
              </div>
              <ul className="space-y-1">
                {whenCompletedBullets(rec).map((b, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-green-400">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>


          {/* Companies doing this better */}
          {competitors.length > 0 && (
            <div className="rounded-md border border-gray-800 bg-black/40 p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                <Users className="h-3 w-3" />
                Brands winning this instead of you
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
                          mentioned on {value} {unit}
                        </span>
                      )}
                    </li>
                  );
                })}
                {userValue >= 0 && (
                  <li className="text-sm text-gray-500 flex items-baseline gap-2 pt-1 border-t border-gray-800 mt-2">
                    <span>•</span>
                    <span>You're only on <span className="text-white">{userValue}</span>.</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Recommended actions */}
          {assetTypes.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                What you should do
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

          {/* Progress checklist */}
          {(() => {
            const items = buildChecklist(rec, assetTypes);
            const doneCount = items.filter((_, i) => checked[i]).length;
            return (
              <div className="rounded-md border border-gray-800 bg-black/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">
                    Your checklist
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {doneCount}/{items.length}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {items.map((it, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        className="flex items-start gap-2 text-left w-full group"
                      >
                        {checked[i] ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-600 shrink-0 mt-0.5 group-hover:text-gray-400" />
                        )}
                        <span
                          className={`text-sm ${
                            checked[i]
                              ? 'text-gray-500 line-through'
                              : 'text-gray-200 group-hover:text-white'
                          }`}
                        >
                          {it}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}


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
                  See the proof ({urls.length + evidenceKeys.length})
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
                  Extra details
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
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-400">
                    <div>
                      Priority:{' '}
                      <span className="text-gray-200">
                        {rec.priority_score != null ? Math.round(Number(rec.priority_score)) : '—'}
                      </span>
                    </div>
                    <div>
                      How sure we are:{' '}
                      <span className="text-gray-200">
                        {Math.round((rec.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                    <div>
                      Expected impact:{' '}
                      <span className="text-gray-200">{rec.expected_impact ?? '—'}</span>
                    </div>
                    <div>
                      Expected gain:{' '}
                      <span className="text-gray-200">
                        {projected ? `+${projected.toFixed(2)}%` : '—'}
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
