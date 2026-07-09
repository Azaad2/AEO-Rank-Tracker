import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditUsage } from '@/components/dashboard/CreditUsage';
import { ScanHistory } from '@/components/dashboard/ScanHistory';
import { SavedDomains } from '@/components/dashboard/SavedDomains';
import { QuickScan } from '@/components/dashboard/QuickScan';
import { RecommendationIntelligence } from '@/components/dashboard/RecommendationIntelligence';
import { WhyCompetitorsWin } from '@/components/dashboard/WhyCompetitorsWin';
import { CompetitorWatch } from '@/components/dashboard/CompetitorWatch';
import { MarketIntelligence } from '@/components/dashboard/intelligence/MarketIntelligence';
import { MetricsExplain } from '@/components/dashboard/MetricsExplain';
import { IndustryBenchmarkTab } from '@/components/dashboard/IndustryBenchmarkTab';
import { CitationIntelligenceTab } from '@/components/dashboard/CitationIntelligenceTab';
import { PromptDiagnosticsTab } from '@/components/dashboard/PromptDiagnosticsTab';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { HomeOverview } from '@/components/dashboard/HomeOverview';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Wrench, Copy } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  plan_id: string;
  prompts_used: number;
  scans_used: number;
  chat_messages_used: number;
}

interface PlanData {
  name: string;
  price_monthly: number;
  prompts_limit: number;
  scans_limit: number;
  chat_limit: number;
}

// Map legacy ?tab= values to new sidebar ids
const LEGACY_TAB_MAP: Record<string, string> = {
  'action-plan': 'recommendations',
  'auto-fix': 'recommendations',
  'overview': 'home',
  'why-win': 'competitors',
  'diagnostics': 'prompts',
};

function PendingFixHandler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!user) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem('pendingFix'); } catch { return; }
    if (!raw) return;
    let pending: any;
    try { pending = JSON.parse(raw); } catch { localStorage.removeItem('pendingFix'); return; }
    localStorage.removeItem('pendingFix');
    setTitle(pending.issueTitle || 'Your fix');
    setOpen(true);
    setLoading(true);
    supabase.functions.invoke('audit-fix', {
      body: {
        url: pending.domain?.startsWith('http') ? pending.domain : `https://${pending.domain}`,
        fixType: pending.fixType,
        pageMeta: { title: pending.domain, description: '', h1: '' },
      },
    }).then(({ data, error }) => {
      if (error) throw error;
      setContent(data?.fix || 'No fix generated.');
    }).catch((e) => {
      console.error(e);
      setContent('Failed to generate fix. Please try again.');
    }).finally(() => setLoading(false));
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wrench className="h-5 w-5 text-yellow-400" />
            {title}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating fix...
          </div>
        ) : (
          <>
            <pre className="bg-black border border-gray-800 rounded p-3 text-xs text-gray-200 whitespace-pre-wrap max-h-[50vh] overflow-auto">
              {content}
            </pre>
            {content && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => { navigator.clipboard.writeText(content); toast({ title: 'Copied' }); }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [domainCount, setDomainCount] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const scanIdParam = searchParams.get('scanId');

  const rawTab = searchParams.get('tab') || 'home';
  const activeTab = LEGACY_TAB_MAP[rawTab] || rawTab;

  const handleSelect = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const [{ data: subData }, { data: domData }, { data: scansData }] = await Promise.all([
        supabase.from('subscriptions').select('plan_id, prompts_used, scans_used, chat_messages_used').eq('user_id', user.id).single(),
        supabase.from('saved_domains').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('scans').select('id, score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);

      const userSubscription = subData || { plan_id: 'free', prompts_used: 0, scans_used: 0, chat_messages_used: 0 };
      setSubscription(userSubscription);
      setDomainCount(domData?.length || 0);
      setScanCount(scansData?.length || 0);
      const scored = (scansData || []).filter((s: any) => typeof s.score === 'number');
      setLatestScore(scored[0]?.score ?? null);
      setPreviousScore(scored[1]?.score ?? null);

      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('name, price_monthly, prompts_limit, scans_limit, chat_limit')
        .eq('id', userSubscription.plan_id)
        .single();
      if (planError) {
        setPlan({ name: 'Free', price_monthly: 0, prompts_limit: 5, scans_limit: 1, chat_limit: 10 });
      } else {
        setPlan(planData);
      }
    } catch (e) {
      console.error('Error fetching user data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Claim guest scan
  useEffect(() => {
    const claim = async () => {
      const pending = scanIdParam || (typeof window !== 'undefined' ? localStorage.getItem('pendingScanId') : null);
      if (!pending || !user) return;
      try {
        const { data: existing } = await supabase.from('scans').select('id, user_id').eq('id', pending).maybeSingle();
        if (existing && !existing.user_id) {
          await supabase.from('scans').update({ user_id: user.id }).eq('id', pending);
        }
      } catch (e) { console.warn('claim scan failed', e); }
      finally { try { localStorage.removeItem('pendingScanId'); } catch {} }
    };
    claim();
  }, [user, scanIdParam]);

  const scoreTrend = useMemo(() => {
    if (latestScore == null || previousScore == null) return null;
    return latestScore - previousScore;
  }, [latestScore, previousScore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  const planName = plan?.name || 'Free';
  const hasUsedAssistant = (subscription?.chat_messages_used || 0) > 0;

  const renderPanel = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeOverview
            onNavigate={handleSelect}
            hasDomain={domainCount > 0}
            hasScan={scanCount > 0}
            hasCompetitors={scanCount > 0}
            hasUsedAssistant={hasUsedAssistant}
            latestScore={latestScore}
            scoreTrend={scoreTrend}
            scanCount={scanCount}
          />
        );
      case 'scan':
        return (
          <div className="space-y-6">
            <CreditUsage
              promptsUsed={subscription?.prompts_used || 0}
              promptsLimit={plan?.prompts_limit || 5}
              scansUsed={subscription?.scans_used || 0}
              scansLimit={plan?.scans_limit || 1}
            />
            <QuickScan onScanComplete={fetchUserData} />
          </div>
        );
      case 'scans':
        return <ScanHistory />;
      case 'recommendations':
        return <RecommendationIntelligence />;
      case 'intelligence':
        return <MarketIntelligence />;
      case 'competitors':
        return (
          <div className="space-y-6">
            <CompetitorWatch />
            <WhyCompetitorsWin />
          </div>
        );
      case 'benchmark':
        return <IndustryBenchmarkTab />;
      case 'citations':
        return <CitationIntelligenceTab />;
      case 'prompts':
        return <PromptDiagnosticsTab />;
      case 'metrics':
        return <MetricsExplain />;
      case 'domains':
        return <SavedDomains />;
      case 'ai-assistant':
        return (
          <AIAssistant
            chatMessagesUsed={subscription?.chat_messages_used || 0}
            chatLimit={plan?.chat_limit ?? 10}
            onMessageSent={fetchUserData}
          />
        );
      default:
        return null;
    }
  };

  const panelTitles: Record<string, string> = {
    home: 'Overview',
    scan: 'New scan',
    scans: 'Scan history',
    recommendations: 'Recommendations',
    competitors: 'Competitors',
    benchmark: 'Benchmark',
    citations: 'Citations',
    prompts: 'Prompts',
    metrics: 'Metrics',
    domains: 'Domains',
    'ai-assistant': 'AI Assistant',
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex w-full min-h-[calc(100vh-3.5rem)] bg-black">
        <DashboardSidebar activeTab={activeTab} onSelect={handleSelect} planName={planName} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-14 z-30 flex items-center gap-3 h-12 border-b border-gray-800 bg-black/95 backdrop-blur px-4">
            <SidebarTrigger className="text-gray-300 hover:text-white" />
            <div className="h-4 w-px bg-gray-800" />
            <h1 className="text-white font-semibold">{panelTitles[activeTab] || 'Dashboard'}</h1>
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <PendingFixHandler />
            <div className="max-w-6xl mx-auto">{renderPanel()}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black">
        <Header />
        <div className="pt-14">
          <DashboardInner />
        </div>
      </div>
    </AuthGuard>
  );
}
