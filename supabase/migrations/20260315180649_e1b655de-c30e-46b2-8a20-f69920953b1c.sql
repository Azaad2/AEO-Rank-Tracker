
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS paypal_plan_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paypal_subscription_id text;
