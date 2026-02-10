import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { CreditUsage } from '@/components/dashboard/CreditUsage';
import { ScanHistory } from '@/components/dashboard/ScanHistory';
import { SavedDomains } from '@/components/dashboard/SavedDomains';
import { ActionPlan } from '@/components/dashboard/ActionPlan';
import { CompetitorWatch } from '@/components/dashboard/CompetitorWatch';
import { QuickScan } from '@/components/dashboard/QuickScan';
import { AutoFixResults } from '@/components/dashboard/AutoFixResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LayoutDashboard, Globe, ListChecks, Swords, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SubscriptionData {
  plan_id: string;
  prompts_used: number;
  scans_used: number;
}

interface PlanData {
  name: string;
  price_monthly: number;
  prompts_limit: number;
  scans_limit: number;
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
        .select('plan_id, prompts_used, scans_used')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      const userSubscription = subData || {
        plan_id: 'free',
        prompts_used: 0,
        scans_used: 0,
      };
      setSubscription(userSubscription);

      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('name, price_monthly, prompts_limit, scans_limit')
        .eq('id', userSubscription.plan_id)
        .single();

      if (planError) {
        console.error('Plan fetch error:', planError);
        setPlan({ name: 'Free', price_monthly: 0, prompts_limit: 5, scans_limit: 1 });
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
      <UserProfile 
        planName={plan?.name || 'Free'} 
        planPrice={plan?.price_monthly || 0} 
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-gray-800 border border-gray-700 w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" />
            My Domains
          </TabsTrigger>
          <TabsTrigger value="action-plan" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <ListChecks className="h-3.5 w-3.5" />
            Action Plan
          </TabsTrigger>
          <TabsTrigger value="competitors" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <Swords className="h-3.5 w-3.5" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="auto-fix" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Auto-Fix Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <CreditUsage
            promptsUsed={subscription?.prompts_used || 0}
            promptsLimit={plan?.prompts_limit || 5}
            scansUsed={subscription?.scans_used || 0}
            scansLimit={plan?.scans_limit || 1}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <QuickScan onScanComplete={() => fetchUserData()} />
            <ScanHistory />
          </div>
        </TabsContent>

        <TabsContent value="domains" className="mt-6">
          <SavedDomains />
        </TabsContent>

        <TabsContent value="action-plan" className="mt-6">
          <ActionPlan />
        </TabsContent>

        <TabsContent value="competitors" className="mt-6">
          <CompetitorWatch />
        </TabsContent>

        <TabsContent value="auto-fix" className="mt-6">
          <AutoFixResults />
        </TabsContent>
      </Tabs>
    </div>
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
              style={{ fontFamily: "'Press Start 2P', cursive" }}
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
