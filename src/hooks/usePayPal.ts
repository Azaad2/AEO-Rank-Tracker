import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePayPalOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePayPal(options: UsePayPalOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = useCallback(async (
    planId: string,
    customerEmail: string,
    userId?: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-subscription', {
        body: { planId, customerEmail, userId },
      });

      if (error || !data?.approvalUrl) {
        throw new Error(data?.error || error?.message || 'Failed to create subscription');
      }

      console.log('PayPal subscription created:', data);

      // Redirect to PayPal approval page
      window.location.href = data.approvalUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate checkout';
      toast.error(message);
      options.onError?.(message);
      setIsLoading(false);
    }
  }, [options]);

  const verifySubscription = useCallback(async (
    subscriptionId: string,
    planId: string,
    customerEmail: string,
    userId?: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-paypal-payment', {
        body: { subscriptionId, planId, customerEmail, userId },
      });

      if (error || !data?.verified) {
        throw new Error(data?.error || 'Payment verification failed');
      }

      toast.success('Payment successful! Your subscription is now active.');
      options.onSuccess?.();
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Payment received but verification failed. Please contact support.');
      options.onError?.(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription cancelled. You will retain access until the end of your billing period.');
      options.onSuccess?.();
    } catch (error) {
      console.error('Cancel error:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
      toast.error(message);
      options.onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    isLoading,
    initiateCheckout,
    verifySubscription,
    cancelSubscription,
  };
}
