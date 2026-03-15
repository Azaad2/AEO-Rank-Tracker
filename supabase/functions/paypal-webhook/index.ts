import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!;
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PAYPAL_BASE_URL = 'https://api-m.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error('Failed to authenticate with PayPal');
  const data = await response.json();
  return data.access_token;
}

async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn('PAYPAL_WEBHOOK_ID not set, skipping signature verification');
    return true;
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: req.headers.get('paypal-auth-algo'),
        cert_url: req.headers.get('paypal-cert-url'),
        transmission_id: req.headers.get('paypal-transmission-id'),
        transmission_sig: req.headers.get('paypal-transmission-sig'),
        transmission_time: req.headers.get('paypal-transmission-time'),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    });

    const result = await verifyResponse.json();
    return result.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(req, body);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(body);
    const eventType = payload.event_type;
    const resource = payload.resource;

    console.log(`Received PayPal webhook: ${eventType}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const paypalSubscriptionId = resource?.id;

    if (!paypalSubscriptionId) {
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse custom_id for metadata
    let customData: any = {};
    try {
      customData = JSON.parse(resource.custom_id || '{}');
    } catch { /* ignore */ }

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        console.log('Subscription activated:', paypalSubscriptionId);

        if (customData.userId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('user_id', customData.userId)
            .eq('status', 'active');
        }

        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', customData.customerEmail)
          .maybeSingle();

        await supabase
          .from('subscriptions')
          .upsert({
            customer_id: customer?.id,
            user_id: customData.userId || null,
            plan_id: customData.planId,
            status: 'active',
            paypal_subscription_id: paypalSubscriptionId,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            prompts_used: 0,
            scans_used: 0,
          }, { onConflict: 'paypal_subscription_id' });

        if (customer) {
          await supabase
            .from('customers')
            .update({ paid_at: new Date().toISOString() })
            .eq('id', customer.id);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        console.log('Subscription cancelled/expired:', paypalSubscriptionId);
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', paypalSubscriptionId);
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        console.log('Subscription suspended:', paypalSubscriptionId);
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', paypalSubscriptionId);
        break;
      }

      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED': {
        console.log('Subscription reactivated:', paypalSubscriptionId);
        await supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', paypalSubscriptionId);
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        console.log('Payment completed for subscription');
        // Reset usage on recurring payment
        const billingAgreementId = resource.billing_agreement_id;
        if (billingAgreementId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              prompts_used: 0,
              scans_used: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('paypal_subscription_id', billingAgreementId);
        }
        break;
      }

      default:
        console.log('Unhandled PayPal event:', eventType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
