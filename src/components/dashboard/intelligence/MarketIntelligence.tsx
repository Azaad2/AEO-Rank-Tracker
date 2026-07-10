import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Flame, Rocket, Sparkles, Swords, Layers, Radio, Globe, Building2 } from 'lucide-react';
import { IntelligenceStatsCard } from './IntelligenceStatsCard';
import { PromptCard, type TrendingPrompt } from './PromptCard';
import { OpportunityDrawer } from './OpportunityDrawer';
import { useAuth } from '@/hooks/useAuth';

type ModuleKey = 'prompts' | 'first-mover' | 'topics' | 'industries' | 'competitors' | 'citations' | 'brands' | 'platforms';

const MODULES: { key: ModuleKey; label: string; icon: any; active: boolean }[] = [
  { key: 'prompts', label: 'Hot questions', icon: Flame, active: true },
  { key: 'first-mover', label: 'Get there first', icon: Rocket, active: true },
  { key: 'topics', label: 'New topics', icon: Sparkles, active: true },
  { key: 'industries', label: 'Your industry', icon: Building2, active: true },
  { key: 'competitors', label: 'Top rivals', icon: Swords, active: true },
  { key: 'citations', label: 'Sources', icon: Layers, active: false },
  { key: 'brands', label: 'Brands', icon: Globe, active: false },
  { key: 'platforms', label: 'AI tools', icon: Radio, active: false },
];

interface Industry { id: string; name: string; slug: string; }

export function MarketIntelligence() {
  const { user } = useAuth();
  const [active, setActive] = useState<ModuleKey>('prompts');
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [userIndustryId, setUserIndustryId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('industries').select('id, name, slug').order('name').then(({ data }) => setIndustries((data ?? []) as Industry[]));
  }, []);

  // Personalization: auto-select user's most recent scan's industry
  useEffect(() => {
    if (!user) return;
    supabase.from('scans').select('industry_id').eq('user_id', user.id).not('industry_id', 'is', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data?.industry_id) {
          setUserIndustryId(data.industry_id);
          setIndustryFilter(data.industry_id);
        }
      });
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl text-yellow-400 font-bold" style={{ fontFamily: "'Press Start 2P', cursive" }}>What people are asking AI</h2>
        <p className="text-sm text-gray-400 mt-2">Real questions people ask ChatGPT, Gemini, Claude and Perplexity in your space — updated as more brands get scanned.</p>
      </div>

      <IntelligenceStatsCard />

      {/* Module tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-800">
        {MODULES.map(m => (
          <button
            key={m.key}
            onClick={() => m.active && setActive(m.key)}
            disabled={!m.active}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
              active === m.key
                ? 'border-yellow-400 text-yellow-400'
                : m.active
                  ? 'border-transparent text-gray-400 hover:text-white'
                  : 'border-transparent text-gray-600 cursor-not-allowed'
            }`}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
            {!m.active && <span className="text-[9px] uppercase text-gray-600">soon</span>}
          </button>
        ))}
      </div>

      {/* Shared industry filter for most modules */}
      {(active === 'prompts' || active === 'first-mover' || active === 'topics' || active === 'competitors') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Your industry:</span>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-56 h-8 bg-gray-900 border-gray-800 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="all">All industries</SelectItem>
              {industries.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {userIndustryId && industryFilter !== userIndustryId && (
            <Button size="sm" variant="outline" className="h-8 text-xs border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
              onClick={() => setIndustryFilter(userIndustryId)}>
              Just show my industry
            </Button>
          )}
        </div>
      )}

      {active === 'prompts' && <TrendingModule industryFilter={industryFilter} />}
      {active === 'first-mover' && <FirstMoverModule industryFilter={industryFilter} />}
      {active === 'topics' && <TopicsModule industryFilter={industryFilter} />}
      {active === 'industries' && <IndustriesModule />}
      {active === 'competitors' && <CompetitorsModule industryFilter={industryFilter} />}
      {!MODULES.find(m => m.key === active)?.active && <ComingSoon />}
    </div>
  );
}

function ComingSoon() {
  return (
    <Card className="bg-gray-900 border-gray-800 p-8 text-center">
      <div className="text-sm text-gray-400">Coming soon. We're getting more data ready to unlock this view.</div>
    </Card>
  );
}

// ---- Trending prompts ----
function TrendingModule({ industryFilter }: { industryFilter: string }) {
  const [prompts, setPrompts] = useState<TrendingPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrendingPrompt | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('prompt_intelligence_trending' as any).select('*').order('opportunity_score', { ascending: false }).limit(24);
    if (industryFilter !== 'all') q = q.eq('industry_id', industryFilter);
    q.then(({ data }) => {
      setPrompts((data ?? []) as unknown as TrendingPrompt[]);
      setLoading(false);
    });
  }, [industryFilter]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>;
  if (prompts.length === 0) return <EmptyIntel message="No hot questions in this space yet. This gets richer as more brands get scanned." />;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {prompts.map(p => (
          <PromptCard key={p.prompt_template_hash + (p.industry_id ?? '')} p={p} onSelect={(x) => { setSelected(x); setDrawerOpen(true); }} />
        ))}
      </div>
      <OpportunityDrawer prompt={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

// ---- First mover ----
function FirstMoverModule({ industryFilter }: { industryFilter: string }) {
  const [prompts, setPrompts] = useState<TrendingPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrendingPrompt | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('first_mover_opportunities' as any).select('*').limit(20);
    if (industryFilter !== 'all') q = q.eq('industry_id', industryFilter);
    q.then(({ data }) => { setPrompts((data ?? []) as unknown as TrendingPrompt[]); setLoading(false); });
  }, [industryFilter]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>;

  return (
    <>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-xs text-orange-200 flex items-start gap-2">
        <Rocket className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <b>You could be first here.</b> These questions are getting popular fast, but no one has really claimed them yet. Publish content now and you win before competitors even notice.
        </div>
      </div>
      {prompts.length === 0
        ? <EmptyIntel message="No first-place opportunities in this space right now. Check back after the next round of scans." />
        : (
          <div className="grid gap-3 md:grid-cols-2">
            {prompts.map(p => <PromptCard key={p.prompt_template_hash + (p.industry_id ?? '')} p={p} onSelect={(x) => { setSelected(x); setDrawerOpen(true); }} />)}
          </div>
        )}
      <OpportunityDrawer prompt={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

// ---- Emerging topics ----
interface EmergingTopic {
  cluster_id: string;
  cluster_label: string;
  industry_id: string | null;
  industry_name: string | null;
  representative_prompt: string;
  intent: string | null;
  commercial_intent_score: number;
  scans_14d: number;
  scans_30d: number;
  prompts_in_cluster: number;
  recency_share_pct: number;
  opportunity_score: number;
}

function TopicsModule({ industryFilter }: { industryFilter: string }) {
  const [topics, setTopics] = useState<EmergingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('emerging_topics' as any).select('*').limit(24);
    if (industryFilter !== 'all') q = q.eq('industry_id', industryFilter);
    q.then(({ data }) => { setTopics((data ?? []) as unknown as EmergingTopic[]); setLoading(false); });
  }, [industryFilter]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>;
  if (topics.length === 0) return <EmptyIntel message="No new topics grouped yet. As more brands get scanned, related questions get grouped here." />;

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {topics.map(t => (
        <Card key={t.cluster_id} className="bg-gray-900 border-gray-800 p-4 hover:border-yellow-400/40 transition-colors">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-white font-semibold text-sm flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />{t.cluster_label}
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-gray-500">Opportunity</div>
              <div className="text-lg font-bold text-yellow-400 leading-none">{t.opportunity_score}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-3 line-clamp-2">{t.representative_prompt}</div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <MiniStat label="Recent scans" value={`${t.scans_14d}`} />
            <MiniStat label="Questions" value={`${t.prompts_in_cluster}`} />
            <MiniStat label="How fresh" value={`${t.recency_share_pct}%`} />
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
            <span>{t.industry_name ?? 'Any industry'}</span>
            <span>{t.intent ?? '—'}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Industries ----
interface IndustryPulse {
  industry_id: string;
  industry_name: string;
  distinct_prompts_30d: number;
  scans_7d: number;
  scans_30d: number;
  citations_30d: number;
  distinct_brands_30d: number;
  distinct_domains_30d: number;
  avg_authority_30d: number | null;
}

function IndustriesModule() {
  const [rows, setRows] = useState<IndustryPulse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('industry_intelligence' as any).select('*').order('scans_30d', { ascending: false }).limit(30)
      .then(({ data }) => { setRows((data ?? []) as unknown as IndustryPulse[]); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>;
  if (rows.length === 0) return <EmptyIntel message="No industry data yet. It fills in as scans come in." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800">
            <th className="py-2 pr-3">Industry</th>
            <th className="py-2 pr-3 text-right">Scans this week</th>
            <th className="py-2 pr-3 text-right">Scans this month</th>
            <th className="py-2 pr-3 text-right">Questions asked</th>
            <th className="py-2 pr-3 text-right">Brands seen</th>
            <th className="py-2 pr-3 text-right">Websites cited</th>
            <th className="py-2 pr-3 text-right">Times cited</th>
            <th className="py-2 pr-3 text-right">Website trust</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.industry_id} className="border-b border-gray-900 text-gray-300 hover:bg-gray-900/40">
              <td className="py-2 pr-3 text-white">{r.industry_name}</td>
              <td className="py-2 pr-3 text-right">{r.scans_7d}</td>
              <td className="py-2 pr-3 text-right">{r.scans_30d}</td>
              <td className="py-2 pr-3 text-right">{r.distinct_prompts_30d}</td>
              <td className="py-2 pr-3 text-right">{r.distinct_brands_30d}</td>
              <td className="py-2 pr-3 text-right">{r.distinct_domains_30d}</td>
              <td className="py-2 pr-3 text-right">{r.citations_30d}</td>
              <td className="py-2 pr-3 text-right">{r.avg_authority_30d != null ? Math.round(r.avg_authority_30d) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Competitors ----
interface CompetitorRow {
  brand: string;
  industry_id: string | null;
  industry_name: string | null;
  prompts_won_30d: number;
  engines_active: number;
  citations_30d: number;
  observations_30d: number;
  engines_list: string[] | null;
}

function CompetitorsModule({ industryFilter }: { industryFilter: string }) {
  const [rows, setRows] = useState<CompetitorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('competitor_intelligence' as any).select('*').order('observations_30d', { ascending: false }).limit(50);
    if (industryFilter !== 'all') q = q.eq('industry_id', industryFilter);
    q.then(({ data }) => { setRows((data ?? []) as unknown as CompetitorRow[]); setLoading(false); });
  }, [industryFilter]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-400" /></div>;
  if (rows.length === 0) return <EmptyIntel message="No rival data here yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800">
            <th className="py-2 pr-3">Brand</th>
            <th className="py-2 pr-3">Industry</th>
            <th className="py-2 pr-3 text-right">Questions won (30d)</th>
            <th className="py-2 pr-3 text-right">AI tools</th>
            <th className="py-2 pr-3 text-right">Times cited</th>
            <th className="py-2 pr-3 text-right">Times seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.brand + i} className="border-b border-gray-900 text-gray-300 hover:bg-gray-900/40">
              <td className="py-2 pr-3 text-white font-medium">{r.brand}</td>
              <td className="py-2 pr-3 text-gray-400">{r.industry_name ?? '—'}</td>
              <td className="py-2 pr-3 text-right">{r.prompts_won_30d}</td>
              <td className="py-2 pr-3 text-right">{r.engines_active}</td>
              <td className="py-2 pr-3 text-right">{r.citations_30d}</td>
              <td className="py-2 pr-3 text-right">{r.observations_30d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/40 border border-gray-800 rounded p-1.5">
      <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function EmptyIntel({ message }: { message: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800 p-8 text-center text-sm text-gray-400">
      {message}
    </Card>
  );
}
