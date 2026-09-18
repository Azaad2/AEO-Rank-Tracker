ALTER TABLE public.user_activity
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_activity_user_created
  ON public.user_activity(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE TABLE public.lifecycle_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_key TEXT NOT NULL,
  context_key TEXT NOT NULL DEFAULT 'default',
  recipient_email TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'cancelled', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, journey_key, context_key)
);

GRANT SELECT, INSERT, UPDATE ON public.lifecycle_email_events TO service_role;

ALTER TABLE public.lifecycle_email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages lifecycle email events"
  ON public.lifecycle_email_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_lifecycle_email_user_created
  ON public.lifecycle_email_events(user_id, created_at DESC);