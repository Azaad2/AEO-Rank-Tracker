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

// Use sandbox for testing, live for production
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

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get PayPal access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planId, customerEmail, userId } = await req.json();

    if (!planId || !customerEmail) {
      return new Response(
        JSON.stringify({ error: 'planId and customerEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating PayPal subscription for plan: ${planId}, email: ${customerEmail}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan.paypal_plan_id) {
      return new Response(
        JSON.stringify({ error: 'PayPal plan not configured. Please contact support.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal subscription
    const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: plan.paypal_plan_id,
        subscriber: {
          name: {
            given_name: customerEmail.split('@')[0],
          },
          email_address: customerEmail,
        },
        application_context: {
          brand_name: 'AI Mention You',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${req.headers.get('origin') || 'https://aimentionyou.com'}/pricing?paypal_success=true&plan_id=${planId}&user_id=${userId || ''}`,
          cancel_url: `${req.headers.get('origin') || 'https://aimentionyou.com'}/pricing?paypal_cancelled=true`,
        },
        custom_id: JSON.stringify({ planId, userId: userId || '', customerEmail }),
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error('Failed to create PayPal subscription:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create PayPal subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('Created PayPal subscription:', subscriptionData.id);

    // Find approval URL
    const approvalLink = subscriptionData.links?.find(
      (link: any) => link.rel === 'approve'
    );

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionData.id,
        approvalUrl: approvalLink?.href,
        status: subscriptionData.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
