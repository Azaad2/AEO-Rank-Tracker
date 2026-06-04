import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  Target,
  Zap,
  History,
} from 'lucide-react';

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

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const METRIC_COLORS: Record<string, string> = {
  RSS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  CAG: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  TSD: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  CIS: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  COI: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
};

interface Props {
  rec: RecommendationRow;
  onChanged?: () => void;
}

export function RecommendationCard({ rec, onChanged }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const done = rec.status === 'completed';
  const evidenceKeys = rec.evidence && typeof rec.evidence === 'object' ? Object.keys(rec.evidence) : [];
  const urls = rec.evidence_urls ?? [];
  const benchmark = rec.industry_benchmark || {};
  const peerMedian = Number(benchmark.peer_median ?? benchmark.median ?? 0);
  const userValue = Number(benchmark.user_value ?? benchmark.you ?? 0);
  const gap = Number(benchmark.gap ?? Math.max(0, peerMedian - userValue));
  const sample = Number(benchmark.peer_sample_size ?? benchmark.sample_size ?? 0);
  const competitors: any[] = Array.isArray(rec.competitor_examples) ? rec.competitor_examples : [];
  const max = Math.max(peerMedian, userValue, 1);

  async function updateStatus(status: string) {
    setBusy(true);
    const { error } = await supabase
      .from('recommendations')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', rec.id);
    setBusy(false);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: status === 'completed' ? 'Marked done' : 'Updated' });
    onChanged?.();
  }

  return (
    <Card className={`bg-gray-900 border-gray-800 ${done ? 'opacity-60' : ''}`}>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {rec.target_metric && (
                <Badge variant="outline" className={METRIC_COLORS[rec.target_metric] || 'border-gray-700 text-gray-300'}>
                  <Target className="h-3 w-3 mr-1" />
                  {rec.target_metric}
                </Badge>
              )}
              <Badge variant="outline" className={DIFF_COLORS[rec.difficulty] || ''}>
                {rec.difficulty}
              </Badge>
              {rec.time_estimate_minutes != null && (
                <Badge variant="outline" className="border-gray-700 text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {rec.time_estimate_minutes}m
                </Badge>
              )}
              {rec.recurrence_count && rec.recurrence_count > 1 && (
                <Badge variant="outline" className="border-gray-700 text-gray-500">
                  <History className="h-3 w-3 mr-1" />
                  seen {rec.recurrence_count}×
                </Badge>
              )}
            </div>
            <h3 className="text-white font-semibold leading-tight">{rec.title}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Priority</div>
            <div className="text-yellow-400 font-bold text-lg leading-none">
              {rec.priority_score != null ? Math.round(Number(rec.priority_score)) : '—'}
            </div>
            {rec.projected_metric_delta != null && Number(rec.projected_metric_delta) !== 0 && (
              <div className="text-[10px] text-green-400 mt-1">
                +{Number(rec.projected_metric_delta).toFixed(1)} {rec.target_metric || ''}
              </div>
            )}
          </div>
        </div>

        {/* Why this matters */}
        {rec.why_this_matters && (
          <p className="text-sm text-gray-300 leading-relaxed">{rec.why_this_matters}</p>
        )}
        {!rec.why_this_matters && rec.description && (
          <p className="text-sm text-gray-400 leading-relaxed">{rec.description}</p>
        )}

        {/* Industry benchmark bar */}
        {sample >= 1 && (peerMedian > 0 || userValue > 0) && (
          <div className="rounded border border-gray-800 bg-black/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Industry benchmark</span>
              <span className="text-gray-500">n={sample}</span>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-400">You</span>
                  <span className="text-white">{userValue}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-gray-500" style={{ width: `${(userValue / max) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-400">Peer median</span>
                  <span className="text-yellow-400">{peerMedian}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${(peerMedian / max) * 100}%` }} />
                </div>
              </div>
            </div>
            {gap > 0 && (
              <div className="text-[11px] text-red-400">Gap: {gap} behind peer median</div>
            )}
          </div>
        )}

        {/* Top competitors */}
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-gray-500 uppercase tracking-wide mr-1 self-center">
              Top peers:
            </span>
            {competitors.slice(0, 3).map((c, i) => (
              <Badge key={i} variant="outline" className="border-gray-700 text-gray-300 text-[11px]">
                {c.brand || c.name || `peer ${i + 1}`}
                {c.value != null && <span className="ml-1 text-yellow-400">{c.value}</span>}
              </Badge>
            ))}
          </div>
        )}

        {/* Evidence drawer */}
        {(urls.length > 0 || evidenceKeys.length > 0) && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400 transition-colors">
                {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Evidence ({urls.length + evidenceKeys.length})
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
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
              {evidenceKeys.length > 0 && (
                <dl className="grid grid-cols-[max-content,1fr] gap-x-3 gap-y-1 text-xs bg-black/40 rounded p-2 border border-gray-800">
                  {evidenceKeys.map((k) => (
                    <div key={k} className="contents">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="text-gray-300 break-all">
                        {typeof rec.evidence[k] === 'object'
                          ? JSON.stringify(rec.evidence[k])
                          : String(rec.evidence[k])}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
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
          {rec.execution_payload?.generator && rec.execution_payload?.generator !== 'manual' && (
            <Badge variant="outline" className="border-purple-500/30 text-purple-300 self-center">
              <Zap className="h-3 w-3 mr-1" />
              Auto-fixable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
