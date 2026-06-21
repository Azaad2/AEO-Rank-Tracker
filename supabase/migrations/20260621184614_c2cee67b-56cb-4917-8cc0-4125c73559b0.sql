
CREATE TABLE public.scan_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  domain TEXT NULL,
  error_type TEXT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT NULL,
  component TEXT NULL,
  url TEXT NULL,
  browser TEXT NULL,
  user_agent TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.scan_errors TO anon, authenticated;
GRANT SELECT ON public.scan_errors TO authenticated;
GRANT ALL ON public.scan_errors TO service_role;

ALTER TABLE public.scan_errors ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can insert error reports
CREATE POLICY "Anyone can log scan errors"
  ON public.scan_errors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read errors
CREATE POLICY "Admins can view scan errors"
  ON public.scan_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX scan_errors_created_at_idx ON public.scan_errors (created_at DESC);
CREATE INDEX scan_errors_user_id_idx ON public.scan_errors (user_id);
CREATE INDEX scan_errors_error_type_idx ON public.scan_errors (error_type);
