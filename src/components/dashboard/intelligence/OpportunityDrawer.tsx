import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { TrendingPrompt } from './PromptCard';
import { Sparkles, FileText, Layers, Swords, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function OpportunityDrawer({ prompt, open, onOpenChange }: { prompt: TrendingPrompt | null; open: boolean; onOpenChange: (v: boolean) => void; }) {
  const [competitors, setCompetitors] = useState<Array<{ brand: string; observations: number }>>([]);
  const [domains, setDomains] = useState<Array<{ domain: string; citations: number }>>([]);
  const [engines, setEngines] = useState<string[]>([]);

  useEffect(() => {
    if (!prompt) return;
    (async () => {
      const { data } = await supabase
        .from('global_intelligence')
        .select('winning_brand, citation_domain, engine, observation_count, citation_frequency')
        .eq('prompt_template_hash', prompt.prompt_template_hash)
        .gte('last_observed_at', new Date(Date.now() - 90 * 86_400_000).toISOString())
        .limit(500);
      const bMap = new Map<string, number>();
      const dMap = new Map<string, number>();
      const eSet = new Set<string>();
      for (const r of data ?? []) {
        if (r.winning_brand) bMap.set(r.winning_brand, (bMap.get(r.winning_brand) ?? 0) + (r.observation_count ?? 1));
        if (r.citation_domain) dMap.set(r.citation_domain, (dMap.get(r.citation_domain) ?? 0) + (r.citation_frequency ?? 1));
        if (r.engine) eSet.add(r.engine);
      }
      setCompetitors([...bMap.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([brand, observations]) => ({ brand, observations })));
      setDomains([...dMap.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([domain, citations]) => ({ domain, citations })));
      setEngines([...eSet]);
    })();
  }, [prompt]);

  if (!prompt) return null;

  const promptText = prompt.display_text ?? 'this trending prompt';
  const encoded = encodeURIComponent(promptText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-base flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400 mt-1 shrink-0" />
            <span>{promptText}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          <Kpi label="Opportunity" value={`${prompt.opportunity_score}`} accent />
          <Kpi label="Growth" value={prompt.growth_pct >= 999 ? 'new' : `${prompt.growth_pct > 0 ? '+' : ''}${prompt.growth_pct}%`} />
          <Kpi label="Confidence" value={`${prompt.confidence_score}%`} />
          <Kpi label="Freshness" value={`${prompt.freshness_days}d`} />
        </div>

        <Section icon={Sparkles} title="Why this matters">
          <p className="text-sm text-gray-300">
            {prompt.trend_bucket === 'exploding' && 'This prompt is exploding across AI assistants. Publishing content now positions your brand before competition intensifies.'}
            {prompt.trend_bucket === 'growing' && 'Interest is growing steadily. Great time to publish before competition catches up.'}
            {prompt.trend_bucket === 'stable' && 'Steady, reliable demand. Strong evergreen opportunity if you can outrank incumbents.'}
            {prompt.trend_bucket === 'declining' && 'Demand is softening. Only pursue if you can differentiate.'}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            Based on <b className="text-yellow-400">{prompt.scans_all}</b> scans across
            {' '}<b className="text-yellow-400">{engines.length || '—'}</b> AI platforms.
          </div>
        </Section>

        <Section icon={Swords} title={`Competitors already winning (${competitors.length})`}>
          {competitors.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No brands winning yet — first-mover territory.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {competitors.map(c => (
                <Badge key={c.brand} className="bg-black/40 border border-gray-700 text-gray-200 text-xs">
                  {c.brand} <span className="text-yellow-400 ml-1">× {c.observations}</span>
                </Badge>
              ))}
            </div>
          )}
        </Section>

        <Section icon={FileText} title={`Domains cited by AI (${domains.length})`}>
          {domains.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No domains cited yet.</p>
          ) : (
            <ul className="text-xs text-gray-300 space-y-1">
              {domains.map(d => (
                <li key={d.domain} className="flex items-center justify-between">
                  <span>{d.domain}</span>
                  <span className="text-yellow-400">{d.citations} citations</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={Layers} title="AI platforms recommending this">
          <div className="flex flex-wrap gap-1.5">
            {engines.length === 0
              ? <span className="text-xs text-gray-500 italic">No platform data yet.</span>
              : engines.map(e => <Badge key={e} variant="outline" className="border-gray-700 text-gray-300 text-xs">{e}</Badge>)}
          </div>
        </Section>

        <div className="border-t border-gray-800 pt-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Create content targeting this prompt</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link to={`/tools/ai-blog-outline?topic=${encoded}`}>
              <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white text-xs">
                Blog outline <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Link to={`/tools/ai-faq-generator?topic=${encoded}`}>
              <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white text-xs">
                FAQ <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Link to={`/tools/competitor-analyzer?topic=${encoded}`}>
              <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white text-xs">
                Comparison <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Link to={`/tools/meta-optimizer?topic=${encoded}`}>
              <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white text-xs">
                Landing page <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-black/40 border border-gray-800 rounded p-2 text-center">
      <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${accent ? 'text-yellow-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-800 pt-3">
      <div className="text-white text-sm font-semibold flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-yellow-400" /> {title}
      </div>
      {children}
    </div>
  );
}
