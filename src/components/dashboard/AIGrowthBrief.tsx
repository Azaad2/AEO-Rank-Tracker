import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, AlertTriangle, Zap, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { HealthGauge, StackedBreakdown } from './recommendations/RecCharts';
import type { RecommendationRow } from './RecommendationCard';

interface Props {
  recs: RecommendationRow[];
}

function priorityToStars(score: number | null | undefined): number {
  if (score == null) return 3;
  const s = Number(score);
  if (s >= 800) return 5;
  if (s >= 600) return 4;
  if (s >= 400) return 3;
  if (s >= 200) return 2;
  return 1;
}

export function AIGrowthBrief({ recs }: Props) {
  if (recs.length === 0) return null;

  const critical = recs.filter((r) => priorityToStars(r.priority_score) >= 5).length;
  const quickWins = recs.filter((r) => r.difficulty === 'easy').length;
  const totalGain = recs.reduce(
    (a, r) => a + Number(r.projected_metric_delta || 0),
    0,
  );
  const totalMins = recs.reduce((a, r) => a + Number(r.time_estimate_minutes || 0), 0);
  const hoursLo = Math.max(1, Math.round(totalMins / 60));
  const hoursHi = Math.max(hoursLo + 2, Math.round((totalMins * 1.4) / 60));

  // Health = 100 - min(60, weighted gap). Simple: derive from ratio of critical/total.
  const health = Math.max(
    30,
    Math.min(95, 100 - critical * 8 - Math.min(30, Math.round(totalGain / 2))),
  );

  const first = [...recs].sort(
    (a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0),
  )[0];

  const healthColor =
    health >= 80 ? 'text-green-400' : health >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Card className="bg-gradient-to-br from-yellow-400/10 via-gray-900 to-gray-900 border-yellow-400/30">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <div className="text-[11px] uppercase tracking-widest text-yellow-400 font-semibold">
            Your growth brief
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
              Overall health
            </div>
            <div className={`text-3xl font-bold ${healthColor}`}>
              {health}
              <span className="text-sm text-gray-500 font-normal"> / 100</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Urgent
            </div>
            <div className="text-3xl font-bold text-red-400">{critical}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Quick wins
            </div>
            <div className="text-3xl font-bold text-green-400">{quickWins}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Possible gain
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              +{Math.round(totalGain)}
              <span className="text-sm text-gray-500 font-normal">%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Time needed
            </div>
            <div className="text-3xl font-bold text-white">
              {hoursLo}–{hoursHi}
              <span className="text-sm text-gray-500 font-normal"> hrs</span>
            </div>
          </div>
        </div>

        {first && (
          <div className="rounded-md border border-yellow-500/30 bg-black/40 p-3 flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-yellow-400/80 font-semibold mb-0.5">
                Start with this
              </div>
              <div className="text-sm text-white">{first.title}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
