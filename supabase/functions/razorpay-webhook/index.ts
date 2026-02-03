import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const subscriptionData = payload.payload?.subscription?.entity;

    console.log(`Received webhook event: ${event}`);

    if (!subscriptionData) {
      console.log('No subscription data in webhook payload');
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const razorpaySubscriptionId = subscriptionData.id;
    const planId = subscriptionData.notes?.plan_id;
    const userId = subscriptionData.notes?.user_id || null;
    const customerId = subscriptionData.customer_id;

    // Get customer email from Razorpay
    let customerEmail = '';
    if (customerId) {
      try {
        const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
        const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
        const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
        
        const customerResponse = await fetch(`https://api.razorpay.com/v1/customers/${customerId}`, {
          headers: { 'Authorization': `Basic ${authHeader}` },
        });
        
        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          customerEmail = customerData.email;
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
      }
    }

    // Find or get customer from database
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    switch (event) {
      case 'subscription.authenticated':
        console.log('Subscription authenticated (pending first payment):', razorpaySubscriptionId);
        break;

      case 'subscription.activated':
        console.log('Subscription activated:', razorpaySubscriptionId);
        
        // Create or update subscription in database
        const { error: activateError } = await supabase
          .from('subscriptions')
          .upsert({
            customer_id: customer?.id,
            user_id: userId || null,
            plan_id: planId,
            status: 'active',
            razorpay_subscription_id: razorpaySubscriptionId,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            prompts_used: 0,
            scans_used: 0,
          }, {
            onConflict: 'razorpay_subscription_id',
          });

        if (activateError) {
          console.error('Error activating subscription:', activateError);
        } else {
          console.log('Subscription activated in database');
          
          // Update customer paid_at
          if (customer) {
            await supabase
              .from('customers')
              .update({ paid_at: new Date().toISOString() })
              .eq('id', customer.id);
          }
        }
        break;

      case 'subscription.charged':
        console.log('Subscription charged (recurring payment):', razorpaySubscriptionId);
        
        // Reset usage and update period
        const { error: chargeError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            prompts_used: 0,
            scans_used: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', razorpaySubscriptionId);

        if (chargeError) {
          console.error('Error updating subscription on charge:', chargeError);
        }
        break;

      case 'subscription.cancelled':
        console.log('Subscription cancelled:', razorpaySubscriptionId);
        
        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', razorpaySubscriptionId);

        if (cancelError) {
          console.error('Error cancelling subscription:', cancelError);
        }
        break;

      case 'subscription.paused':
        console.log('Subscription paused:', razorpaySubscriptionId);
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', razorpaySubscriptionId);
        break;

      case 'subscription.resumed':
        console.log('Subscription resumed:', razorpaySubscriptionId);
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', razorpaySubscriptionId);
        break;

      case 'subscription.pending':
        console.log('Subscription pending:', razorpaySubscriptionId);
        break;

      case 'subscription.halted':
        console.log('Subscription halted (payment failed):', razorpaySubscriptionId);
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', razorpaySubscriptionId);
        break;

      default:
        console.log('Unhandled event type:', event);
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
