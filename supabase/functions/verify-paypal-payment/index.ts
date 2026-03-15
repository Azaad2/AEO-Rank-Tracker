import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!;
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subscriptionId, planId, customerEmail, userId } = await req.json();

    console.log('Verifying PayPal subscription:', subscriptionId);

    // Get subscription details from PayPal
    const accessToken = await getPayPalAccessToken();
    const subResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!subResponse.ok) {
      const errorData = await subResponse.text();
      console.error('Failed to fetch PayPal subscription:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to verify subscription', verified: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subData = await subResponse.json();
    console.log('PayPal subscription status:', subData.status);

    if (subData.status !== 'ACTIVE' && subData.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({ error: 'Subscription is not active', verified: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get customer
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .maybeSingle();

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .maybeSingle();

    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_id: planId,
          updated_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);
    } else {
      // Deactivate old subscriptions
      if (userId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('status', 'active');
        console.log('Deactivated old subscriptions for user:', userId);
      }

      // Create new subscription
      const { error: createError } = await supabase
        .from('subscriptions')
        .insert({
          customer_id: customer?.id,
          user_id: userId || null,
          plan_id: planId,
          status: 'active',
          paypal_subscription_id: subscriptionId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          prompts_used: 0,
          scans_used: 0,
        });

      if (createError) {
        console.error('Error creating subscription:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription record', verified: true }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update customer
    if (customer) {
      await supabase
        .from('customers')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', customer.id);
    }

    console.log('Subscription verified and activated successfully');

    return new Response(
      JSON.stringify({ verified: true, message: 'Subscription activated' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', verified: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
