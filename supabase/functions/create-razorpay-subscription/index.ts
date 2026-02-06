import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CreateSubscriptionRequest {
  planId: string;
  customerEmail: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planId, customerEmail, userId } = await req.json() as CreateSubscriptionRequest;

    if (!planId || !customerEmail) {
      return new Response(
        JSON.stringify({ error: 'planId and customerEmail are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating subscription for plan: ${planId}, email: ${customerEmail}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the plan details including razorpay_plan_id
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan.razorpay_plan_id) {
      console.error('Razorpay plan ID not configured for plan:', planId);
      return new Response(
        JSON.stringify({ error: 'Razorpay plan not configured. Please contact support.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Check if customer exists in our database
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .maybeSingle();

    let razorpayCustomerId: string;

    if (existingCustomer?.stripe_customer_id) {
      // Reuse existing Razorpay customer (stored in stripe_customer_id for compatibility)
      razorpayCustomerId = existingCustomer.stripe_customer_id;
      console.log('Using existing Razorpay customer:', razorpayCustomerId);
    } else {
      // Create new Razorpay customer
      const customerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerEmail.split('@')[0],
          email: customerEmail,
          fail_existing: '0', // Return existing customer if email matches
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.error('Failed to create Razorpay customer:', errorData);
        return new Response(
          JSON.stringify({ error: 'Failed to create customer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const customerData = await customerResponse.json();
      razorpayCustomerId = customerData.id;
      console.log('Created Razorpay customer:', razorpayCustomerId);

      // Store customer in database
      if (existingCustomer) {
        await supabase
          .from('customers')
          .update({ stripe_customer_id: razorpayCustomerId })
          .eq('id', existingCustomer.id);
      } else {
        await supabase
          .from('customers')
          .insert({
            email: customerEmail,
            stripe_customer_id: razorpayCustomerId,
          });
      }
    }

    // Create Razorpay subscription
    const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.razorpay_plan_id,
        customer_id: razorpayCustomerId,
        total_count: 12, // 12 billing cycles (1 year for monthly)
        quantity: 1,
        customer_notify: 1,
        notes: {
          plan_id: planId,
          user_id: userId || '',
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error('Failed to create Razorpay subscription:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('Created Razorpay subscription:', subscriptionData.id);

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionData.id,
        shortUrl: subscriptionData.short_url,
        status: subscriptionData.status,
        customerId: razorpayCustomerId,
        keyId: RAZORPAY_KEY_ID,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
