import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseRazorpayOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useRazorpay(options: UseRazorpayOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = useCallback(async (
    planId: string,
    customerEmail: string,
    userId?: string
  ) => {
    setIsLoading(true);

    try {
      // Create subscription via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: { planId, customerEmail, userId },
      });

      if (error || !data?.subscriptionId) {
        throw new Error(data?.error || error?.message || 'Failed to create subscription');
      }

      console.log('Subscription created:', data);

      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      // Get Razorpay key from environment
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
        // Fallback: show short URL for payment
        if (data.shortUrl) {
          window.open(data.shortUrl, '_blank');
          toast.info('Opening payment page in a new tab');
          setIsLoading(false);
          return;
        }
        throw new Error('Payment configuration error');
      }

      // Open Razorpay checkout
      const razorpayOptions = {
        key: razorpayKey,
        subscription_id: data.subscriptionId,
        name: 'AI Mention You',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - Monthly`,
        prefill: {
          email: customerEmail,
        },
        theme: {
          color: '#facc15', // Yellow-400
        },
        handler: async function(response: any) {
          console.log('Payment successful:', response);
          
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                customerEmail,
                userId,
              },
            });

            if (verifyError || !verifyData?.verified) {
              throw new Error('Payment verification failed');
            }

            toast.success('Payment successful! Your subscription is now active.');
            options.onSuccess?.();
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment received but verification failed. Please contact support.');
          }
          
          setIsLoading(false);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setIsLoading(false);
          },
          escape: true,
          animation: true,
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      
      razorpay.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
        options.onError?.(response.error?.description || 'Payment failed');
        setIsLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate checkout';
      toast.error(message);
      options.onError?.(message);
      setIsLoading(false);
    }
  }, [options]);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setIsLoading(true);
    
    try {
      // For now, just update status in database
      // Full cancellation would require calling Razorpay API
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', subscriptionId);

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
    cancelSubscription,
  };
}
