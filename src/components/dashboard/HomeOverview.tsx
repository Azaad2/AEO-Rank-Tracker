import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingChecklist } from './OnboardingChecklist';
import { TrendingUp, Sparkles, Swords, FileText, Radar, ArrowRight } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface HomeOverviewProps {
  onNavigate: (tab: string) => void;
  hasDomain: boolean;
  hasScan: boolean;
  hasCompetitors: boolean;
  hasUsedAssistant: boolean;
  latestScore: number | null;
  scoreTrend: number | null;
  scanCount: number;
}

function KpiCard({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: 'default' | 'up' | 'down' }) {
  const toneCls = tone === 'up' ? 'text-green-400' : tone === 'down' ? 'text-red-400' : 'text-yellow-400';
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}

export function HomeOverview({
  onNavigate,
  hasDomain,
  hasScan,
  hasCompetitors,
  hasUsedAssistant,
  latestScore,
  scoreTrend,
  scanCount,
}: HomeOverviewProps) {
  const trendTone: 'up' | 'down' | 'default' =
    scoreTrend == null ? 'default' : scoreTrend > 0 ? 'up' : scoreTrend < 0 ? 'down' : 'default';

  return (
    <div className="space-y-6">
      <OnboardingChecklist
        hasDomain={hasDomain}
        hasScan={hasScan}
        hasCompetitors={hasCompetitors}
        hasReviewedRec={hasScan}
        hasUsedAssistant={hasUsedAssistant}
        onNavigate={onNavigate}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Visibility"
          value={latestScore != null ? `${latestScore}` : '—'}
          hint="Last scan score"
        />
        <KpiCard
          label="Trend"
          value={scoreTrend != null ? `${scoreTrend > 0 ? '+' : ''}${scoreTrend}` : '—'}
          hint="Vs previous"
          tone={trendTone}
        />
        <KpiCard label="Scans" value={`${scanCount}`} hint="Lifetime" />
        <KpiCard label="Industry avg" value="34" hint="Benchmark" />
      </div>

      {!hasScan ? (
        <EmptyState
          icon={Radar}
          title="Run your first AI visibility scan"
          description="See where AI assistants mention (or miss) your brand across ChatGPT, Perplexity, Gemini, and Google."
          actionLabel="Start scan"
          onAction={() => onNavigate('scan')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                Top recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">Jump into your prioritized action list to close the biggest gaps.</p>
              <Button variant="outline" size="sm" onClick={() => onNavigate('recommendations')} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                View recommendations <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Swords className="h-4 w-4 text-yellow-400" />
                Competitor gap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">See which competitors AI models cite more often — and why.</p>
              <Button variant="outline" size="sm" onClick={() => onNavigate('competitors')} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                Analyze gap <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-400" />
                Citations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">Track the sources AI assistants pull from when answering about you.</p>
              <Button variant="outline" size="sm" onClick={() => onNavigate('citations')} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                View citations <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                Benchmark
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">Compare your visibility against the industry average of 34.</p>
              <Button variant="outline" size="sm" onClick={() => onNavigate('benchmark')} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                Open benchmark <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
