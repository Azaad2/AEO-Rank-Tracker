import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
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
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      planId,
      customerEmail,
      userId,
    } = await req.json() as VerifyPaymentRequest;

    console.log('Verifying payment:', { razorpay_payment_id, razorpay_subscription_id });

    // Verify signature
    const generatedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid payment signature');
      return new Response(
        JSON.stringify({ error: 'Invalid payment signature', verified: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment signature verified successfully');

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
      .eq('razorpay_subscription_id', razorpay_subscription_id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_id: planId,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', razorpay_subscription_id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
      }
    } else {
      // Deactivate all existing active subscriptions for this user before creating new one
      if (userId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('status', 'active');
        console.log('Deactivated old active subscriptions for user:', userId);
      }

      // Create new subscription
      const { error: createError } = await supabase
        .from('subscriptions')
        .insert({
          customer_id: customer?.id,
          user_id: userId || null,
          plan_id: planId,
          status: 'active',
          razorpay_subscription_id: razorpay_subscription_id,
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

    // Update customer paid_at
    if (customer) {
      await supabase
        .from('customers')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', customer.id);
    }

    console.log('Subscription created/updated successfully');

    return new Response(
      JSON.stringify({
        verified: true,
        message: 'Payment verified and subscription activated',
      }),
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
