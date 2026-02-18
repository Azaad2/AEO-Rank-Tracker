
-- Add auto_monitor_limit to plans
ALTER TABLE public.plans ADD COLUMN auto_monitor_limit integer NOT NULL DEFAULT 0;

-- Add monitoring_prompts table
CREATE TABLE public.monitoring_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  prompts text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monitoring_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read monitoring_prompts" ON public.monitoring_prompts FOR SELECT USING (true);
CREATE POLICY "Service insert monitoring_prompts" ON public.monitoring_prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update monitoring_prompts" ON public.monitoring_prompts FOR UPDATE USING (true);

-- Add is_auto_scan to scans
ALTER TABLE public.scans ADD COLUMN is_auto_scan boolean NOT NULL DEFAULT false;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
