import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { CreditUsage } from '@/components/dashboard/CreditUsage';
import { ScanHistory } from '@/components/dashboard/ScanHistory';
import { SavedDomains } from '@/components/dashboard/SavedDomains';
import { QuickScan } from '@/components/dashboard/QuickScan';
import { RecommendationIntelligence } from '@/components/dashboard/RecommendationIntelligence';
import { WhyCompetitorsWin } from '@/components/dashboard/WhyCompetitorsWin';
import { MetricsExplain } from '@/components/dashboard/MetricsExplain';
import { IndustryBenchmarkTab } from '@/components/dashboard/IndustryBenchmarkTab';
import { CitationIntelligenceTab } from '@/components/dashboard/CitationIntelligenceTab';
import { PromptDiagnosticsTab } from '@/components/dashboard/PromptDiagnosticsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Globe, Sparkles, Bot, Wrench, Copy, Swords, BarChart3, Radar, TrendingUp, FileText, MessageSquare, MoreHorizontal } from 'lucide-react';
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

function PendingFixHandler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!user) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem("pendingFix"); } catch { return; }
    if (!raw) return;
    let pending: any;
    try { pending = JSON.parse(raw); } catch { localStorage.removeItem("pendingFix"); return; }
    localStorage.removeItem("pendingFix");
    setTitle(pending.issueTitle || "Your fix");
    setOpen(true);
    setLoading(true);
    supabase.functions.invoke("audit-fix", {
      body: {
        url: pending.domain?.startsWith("http") ? pending.domain : `https://${pending.domain}`,
        fixType: pending.fixType,
        pageMeta: { title: pending.domain, description: "", h1: "" },
      },
    }).then(({ data, error }) => {
      if (error) throw error;
      setContent(data?.fix || "No fix generated.");
    }).catch((e) => {
      console.error(e);
      setContent("Failed to generate fix. Please try again.");
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
                  onClick={() => { navigator.clipboard.writeText(content); toast({ title: "Copied" }); }}
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

function DashboardContent() {

  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id, prompts_used, scans_used, chat_messages_used')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      const userSubscription = subData || {
        plan_id: 'free',
        prompts_used: 0,
        scans_used: 0,
        chat_messages_used: 0,
      };
      setSubscription(userSubscription);

      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('name, price_monthly, prompts_limit, scans_limit, chat_limit')
        .eq('id', userSubscription.plan_id)
        .single();

      if (planError) {
        console.error('Plan fetch error:', planError);
        setPlan({ name: 'Free', price_monthly: 0, prompts_limit: 5, scans_limit: 1, chat_limit: 10 });
      } else {
        setPlan(planData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PendingFixHandler />

      <UserProfile 
        planName={plan?.name || 'Free'} 
        planPrice={plan?.price_monthly || 0} 
      />

      <DashboardTabs subscription={subscription} plan={plan} onChanged={fetchUserData} />
    </div>
  );
}

function DashboardTabs({
  subscription,
  plan,
  onChanged,
}: {
  subscription: SubscriptionData | null;
  plan: PlanData | null;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const scanIdParam = searchParams.get('scanId');

  // Legacy redirects to new tab structure
  const initial = (() => {
    switch (tabParam) {
      case 'action-plan':
      case 'auto-fix':
      case 'overview':
        return 'recommendations';
      case 'competitors':
        return 'why-win';
      case 'benchmark':
        return 'benchmark';
      case 'citations':
        return 'citations';
      case 'diagnostics':
        return 'diagnostics';
      case 'metrics':
        return 'metrics';
      case 'domains':
        return 'domains';
      case 'scans':
        return 'scans';
      case 'ai-assistant':
        return 'ai-assistant';
      default:
        return 'recommendations';
    }
  })();
  const [tab, setTab] = useState(initial);

  // Claim a guest scan post-signup
  useEffect(() => {
    const claim = async () => {
      const pending = scanIdParam || (typeof window !== 'undefined' ? localStorage.getItem('pendingScanId') : null);
      if (!pending || !user) return;
      try {
        const { data: existing } = await supabase
          .from('scans')
          .select('id, user_id')
          .eq('id', pending)
          .maybeSingle();
        if (existing && !existing.user_id) {
          await supabase.from('scans').update({ user_id: user.id }).eq('id', pending);
        }
      } catch (e) {
        console.warn('claim scan failed', e);
      } finally {
        try { localStorage.removeItem('pendingScanId'); } catch {}
      }
    };
    claim();
  }, [user, scanIdParam]);

  const handleTabChange = (v: string) => {
    setTab(v);
    setSearchParams({ tab: v }, { replace: true });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="bg-gray-800 border border-gray-700 w-full flex flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="recommendations" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Recommendations
        </TabsTrigger>
        <TabsTrigger value="why-win" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
          <Swords className="h-3.5 w-3.5" />
          Why Competitors Win
        </TabsTrigger>
        <TabsTrigger value="benchmark" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
          <TrendingUp className="h-3.5 w-3.5" />
          Industry Benchmark
        </TabsTrigger>
        <TabsTrigger value="citations" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
          <FileText className="h-3.5 w-3.5" />
          Citation Intelligence
        </TabsTrigger>
        <TabsTrigger value="diagnostics" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
          <MessageSquare className="h-3.5 w-3.5" />
          Prompt Diagnostics
        </TabsTrigger>
        <TabsTrigger value="metrics" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
          <BarChart3 className="h-3.5 w-3.5" />
          Metrics
        </TabsTrigger>
        <TabsTrigger value="domains" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm opacity-80">
          <Globe className="h-3.5 w-3.5" />
          Domains
        </TabsTrigger>
        <TabsTrigger value="scans" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm opacity-80">
          <Radar className="h-3.5 w-3.5" />
          Scans
        </TabsTrigger>
        <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm opacity-80">
          <Bot className="h-3.5 w-3.5" />
          AI Assistant
        </TabsTrigger>
      </TabsList>

      <TabsContent value="recommendations" className="mt-6">
        <RecommendationIntelligence />
      </TabsContent>

      <TabsContent value="why-win" className="mt-6">
        <WhyCompetitorsWin />
      </TabsContent>

      <TabsContent value="benchmark" className="mt-6">
        <IndustryBenchmarkTab />
      </TabsContent>

      <TabsContent value="citations" className="mt-6">
        <CitationIntelligenceTab />
      </TabsContent>

      <TabsContent value="diagnostics" className="mt-6">
        <PromptDiagnosticsTab />
      </TabsContent>

      <TabsContent value="metrics" className="mt-6">
        <MetricsExplain />
      </TabsContent>

      <TabsContent value="domains" className="mt-6">
        <SavedDomains />
      </TabsContent>

      <TabsContent value="scans" className="mt-6 space-y-6">
        <CreditUsage
          promptsUsed={subscription?.prompts_used || 0}
          promptsLimit={plan?.prompts_limit || 5}
          scansUsed={subscription?.scans_used || 0}
          scansLimit={plan?.scans_limit || 1}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <QuickScan onScanComplete={onChanged} />
          <ScanHistory />
        </div>
      </TabsContent>

      <TabsContent value="ai-assistant" className="mt-6">
        <AIAssistant
          chatMessagesUsed={subscription?.chat_messages_used || 0}
          chatLimit={plan?.chat_limit ?? 10}
          onMessageSent={onChanged}
        />
      </TabsContent>
    </Tabs>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black">
        <Header />
        <div className="pt-32 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <h1 
              className="text-2xl md:text-3xl font-bold text-white mb-8"
            >
              Dashboard
            </h1>
            <DashboardContent />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
