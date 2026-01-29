-- Create slack_configs table
CREATE TABLE public.slack_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  is_active boolean DEFAULT true,
  notify_on_scan boolean DEFAULT true,
  score_threshold integer DEFAULT 40,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create slack_alert_history table
CREATE TABLE public.slack_alert_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid REFERENCES public.slack_configs(id) ON DELETE CASCADE,
  scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  message_ts text,
  sent_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slack_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_alert_history ENABLE ROW LEVEL SECURITY;

-- Public insert/select/update for slack_configs (no auth required)
CREATE POLICY "Allow public insert on slack_configs" 
ON public.slack_configs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on slack_configs" 
ON public.slack_configs FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on slack_configs" 
ON public.slack_configs FOR UPDATE 
USING (true);

-- Public insert/select for slack_alert_history
CREATE POLICY "Allow public insert on slack_alert_history" 
ON public.slack_alert_history FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on slack_alert_history" 
ON public.slack_alert_history FOR SELECT 
USING (true);

-- Create trigger for updating updated_at on slack_configs
CREATE TRIGGER update_slack_configs_updated_at
BEFORE UPDATE ON public.slack_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();