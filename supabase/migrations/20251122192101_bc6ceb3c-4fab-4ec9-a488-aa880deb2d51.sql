-- Create user_activity table for detailed activity logging
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_metadata JSONB,
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for activity logging
CREATE POLICY "Allow public insert activity"
ON public.user_activity
FOR INSERT
WITH CHECK (true);

-- Restrict selects (for future admin dashboard)
CREATE POLICY "Restrict select activity"
ON public.user_activity
FOR SELECT
USING (false);

-- Create index for efficient querying by event type and timestamp
CREATE INDEX idx_user_activity_event_type ON public.user_activity(event_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX idx_user_activity_session_id ON public.user_activity(session_id);