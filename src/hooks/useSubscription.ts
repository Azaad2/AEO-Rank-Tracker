import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  scans_limit: number;
  prompts_limit: number;
  features: {
    csv_export?: boolean;
    slack_alerts?: boolean;
    api_access?: boolean;
    white_label?: boolean;
    multi_site?: boolean;
  };
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "past_due" | "trialing";
  razorpay_subscription_id: string | null;
  paypal_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string | null;
  prompts_used: number;
  scans_used: number;
  created_at: string;
  updated_at: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: Plan | null;
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  usage: {
    promptsUsed: number;
    promptsLimit: number;
    scansUsed: number;
    scansLimit: number;
    promptsRemaining: number;
    scansRemaining: number;
    isAtPromptsLimit: boolean;
    isAtScansLimit: boolean;
  };
  fetchSubscription: (customerId: string) => Promise<void>;
  createFreeSubscription: (customerId: string) => Promise<Subscription | null>;
  incrementUsage: (customerId: string, promptsToAdd?: number) => Promise<void>;
  canUseFeature: (feature: keyof Plan["features"]) => boolean;
}

export function useSubscription(customerId?: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all plans
  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("price_monthly", { ascending: true });

    if (error) {
      console.error("Error fetching plans:", error);
      return;
    }

    setPlans(data as Plan[]);
  }, []);

  // Fetch subscription for a customer
  const fetchSubscription = useCallback(async (custId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("customer_id", custId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        throw subError;
      }

      if (subData) {
        setSubscription(subData as Subscription);

        // Fetch the associated plan
        const { data: planData, error: planError } = await supabase
          .from("plans")
          .select("*")
          .eq("id", subData.plan_id)
          .single();

        if (planError) {
          throw planError;
        }

        setPlan(planData as Plan);
      } else {
        setSubscription(null);
        setPlan(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch subscription");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a free subscription for new customers
  const createFreeSubscription = useCallback(async (custId: string): Promise<Subscription | null> => {
    try {
      // Check if subscription already exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("customer_id", custId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        setSubscription(existing as Subscription);
        return existing as Subscription;
      }

      // Create new free subscription
      const { data: newSub, error: createError } = await supabase
        .from("subscriptions")
        .insert({
          customer_id: custId,
          plan_id: "free",
          status: "active",
          current_period_start: new Date().toISOString(),
          prompts_used: 0,
          scans_used: 0,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setSubscription(newSub as Subscription);

      // Set free plan
      const freePlan = plans.find((p) => p.id === "free");
      if (freePlan) {
        setPlan(freePlan);
      }

      return newSub as Subscription;
    } catch (err) {
      console.error("Error creating free subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to create subscription");
      return null;
    }
  }, [plans]);

  // Increment usage counters
  const incrementUsage = useCallback(async (custId: string, promptsToAdd: number = 1) => {
    if (!subscription) return;

    try {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          prompts_used: subscription.prompts_used + promptsToAdd,
          scans_used: subscription.scans_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh subscription data
      await fetchSubscription(custId);
    } catch (err) {
      console.error("Error incrementing usage:", err);
    }
  }, [subscription, fetchSubscription]);

  // Check if user can use a specific feature
  const canUseFeature = useCallback((feature: keyof Plan["features"]): boolean => {
    if (!plan?.features) return false;
    return plan.features[feature] === true;
  }, [plan]);

  // Calculate usage stats
  const usage = {
    promptsUsed: subscription?.prompts_used ?? 0,
    promptsLimit: plan?.prompts_limit ?? 5,
    scansUsed: subscription?.scans_used ?? 0,
    scansLimit: plan?.scans_limit ?? 1,
    promptsRemaining: Math.max(0, (plan?.prompts_limit ?? 5) - (subscription?.prompts_used ?? 0)),
    scansRemaining: plan?.scans_limit === -1 
      ? Infinity 
      : Math.max(0, (plan?.scans_limit ?? 1) - (subscription?.scans_used ?? 0)),
    isAtPromptsLimit: (subscription?.prompts_used ?? 0) >= (plan?.prompts_limit ?? 5),
    isAtScansLimit: plan?.scans_limit !== -1 && (subscription?.scans_used ?? 0) >= (plan?.scans_limit ?? 1),
  };

  // Initial fetch
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (customerId) {
      fetchSubscription(customerId);
    }
  }, [customerId, fetchSubscription]);

  return {
    subscription,
    plan,
    plans,
    isLoading,
    error,
    usage,
    fetchSubscription,
    createFreeSubscription,
    incrementUsage,
    canUseFeature,
  };
}
