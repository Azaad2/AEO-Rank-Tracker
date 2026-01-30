-- Plans reference table
CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly integer NOT NULL DEFAULT 0,
  scans_limit integer NOT NULL DEFAULT 1,
  prompts_limit integer NOT NULL DEFAULT 5,
  features jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default plans
INSERT INTO public.plans (id, name, price_monthly, scans_limit, prompts_limit, features) VALUES
  ('free', 'Free', 0, 1, 5, '{"csv_export": false, "slack_alerts": false, "api_access": false}'),
  ('pro', 'Pro', 1900, 10, 50, '{"csv_export": true, "slack_alerts": true, "api_access": true}'),
  ('team', 'Team', 4900, 30, 150, '{"csv_export": true, "slack_alerts": true, "api_access": true, "white_label": true}'),
  ('agency', 'Agency', 14900, -1, 500, '{"csv_export": true, "slack_alerts": true, "api_access": true, "white_label": true, "multi_site": true}');

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  plan_id text REFERENCES public.plans(id) DEFAULT 'free',
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  razorpay_subscription_id text,
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone,
  prompts_used integer DEFAULT 0,
  scans_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_razorpay ON public.subscriptions(razorpay_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans (public read)
CREATE POLICY "Plans are public readable" ON public.plans FOR SELECT USING (true);

-- RLS Policies for subscriptions (public access for now, will tighten with auth later)
CREATE POLICY "Subscriptions public insert" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Subscriptions public select" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Subscriptions public update" ON public.subscriptions FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();