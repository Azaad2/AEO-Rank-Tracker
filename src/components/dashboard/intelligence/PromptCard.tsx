import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Flame, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

export interface TrendingPrompt {
  prompt_template_hash: string;
  display_text: string | null;
  industry_id: string | null;
  industry_name: string | null;
  scans_7d: number;
  scans_30d: number;
  scans_90d: number;
  scans_all: number;
  cites_7d: number;
  growth_pct: number;
  citation_growth_pct: number;
  competitors_answering: number;
  domains_cited: number;
  freshness_days: number;
  trend_bucket: 'exploding' | 'growing' | 'stable' | 'declining';
  opportunity_score: number;
  confidence_score: number;
  reasons: {
    scan_delta: number;
    citation_delta: number;
    brands_ranking: number;
    domains_cited: number;
    freshness_days: number;
  };
}

const bucketMeta: Record<TrendingPrompt['trend_bucket'], { label: string; cls: string; Icon: typeof Flame }> = {
  exploding: { label: '🔥 Exploding', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/40', Icon: Flame },
  growing: { label: '📈 Growing', cls: 'bg-green-500/20 text-green-300 border-green-500/40', Icon: TrendingUp },
  stable: { label: '➡ Stable', cls: 'bg-gray-800 text-gray-300 border-gray-700', Icon: Minus },
  declining: { label: '📉 Declining', cls: 'bg-red-500/20 text-red-300 border-red-500/40', Icon: TrendingDown },
};

export function PromptCard({ p, onSelect }: { p: TrendingPrompt; onSelect: (p: TrendingPrompt) => void }) {
  const bucket = bucketMeta[p.trend_bucket];
  const reasons: string[] = [];
  if (p.reasons.scan_delta > 0) reasons.push(`↑ ${p.reasons.scan_delta} more scans this week`);
  if (p.reasons.citation_delta > 0) reasons.push(`↑ ${p.reasons.citation_delta} more citations`);
  if (p.reasons.brands_ranking > 0) reasons.push(`${p.reasons.brands_ranking} competitors already rank`);
  if (p.freshness_days <= 7) reasons.push(`Fresh — seen ${p.freshness_days}d ago`);
  if (reasons.length === 0) reasons.push('Steady signal from live scans');

  return (
    <Card className="bg-gray-900 border-gray-800 p-4 hover:border-yellow-400/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={`${bucket.cls} border text-[10px]`}>{bucket.label}</Badge>
            {p.industry_name && (
              <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">{p.industry_name}</Badge>
            )}
            <span className="text-[10px] text-gray-500">Confidence {p.confidence_score}%</span>
          </div>
          <div className="text-white text-sm font-medium leading-snug break-words">
            {p.display_text ?? <span className="text-gray-500 italic">Prompt template #{p.prompt_template_hash.slice(0, 6)}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-gray-500">Opportunity</div>
          <div className="text-2xl font-bold text-yellow-400 leading-none">{p.opportunity_score}</div>
          <div className="text-[10px] text-gray-500">/ 100</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat label="Growth" value={p.growth_pct >= 999 ? 'new' : `${p.growth_pct > 0 ? '+' : ''}${p.growth_pct}%`} tone={p.growth_pct > 0 ? 'up' : 'default'} />
        <Stat label="Scans 7d" value={`${p.scans_7d}`} />
        <Stat label="Competitors" value={`${p.competitors_answering}`} />
        <Stat label="Citations" value={`${p.cites_7d}`} />
      </div>

      <div className="bg-black/40 border border-gray-800 rounded p-2 mb-3">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-yellow-400" /> Why it's {p.trend_bucket}
        </div>
        <ul className="text-xs text-gray-300 space-y-0.5">
          {reasons.map(r => <li key={r}>• {r}</li>)}
        </ul>
      </div>

      <Button size="sm" onClick={() => onSelect(p)} className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
        See opportunity <ArrowRight className="ml-1 h-3 w-3" />
      </Button>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'default' }) {
  return (
    <div className="bg-black/40 border border-gray-800 rounded p-1.5">
      <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
      <div className={`text-sm font-bold ${tone === 'up' ? 'text-green-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}
