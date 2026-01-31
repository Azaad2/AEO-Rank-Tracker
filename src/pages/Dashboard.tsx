import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { CreditUsage } from '@/components/dashboard/CreditUsage';
import { ScanHistory } from '@/components/dashboard/ScanHistory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
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

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      try {
        // Fetch user's subscription
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

        // Fetch plan details
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('name, price_monthly, prompts_limit, scans_limit')
          .eq('id', userSubscription.plan_id)
          .single();

        if (planError) {
          console.error('Plan fetch error:', planError);
          // Default plan values
          setPlan({
            name: 'Free',
            price_monthly: 0,
            prompts_limit: 5,
            scans_limit: 1,
          });
        } else {
          setPlan(planData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    }

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
      {/* User Profile Card */}
      <UserProfile 
        planName={plan?.name || 'Free'} 
        planPrice={plan?.price_monthly || 0} 
      />

      {/* Credit Usage */}
      <CreditUsage
        promptsUsed={subscription?.prompts_used || 0}
        promptsLimit={plan?.prompts_limit || 5}
        scansUsed={subscription?.scans_used || 0}
        scansLimit={plan?.scans_limit || 1}
      />

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link to="/#scan">
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
            Run New Scan
          </Button>
        </Link>
        <Link to="/tools">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Explore Tools
          </Button>
        </Link>
      </div>

      {/* Scan History */}
      <ScanHistory />
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black">
        <Header />
        <div className="pt-24 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
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
