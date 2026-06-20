
CREATE TABLE public.newsletter_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  send_date date NOT NULL,
  subject text NOT NULL,
  body_snippet text,
  broadcast_id text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX newsletter_log_date_sent_unique
  ON public.newsletter_log (send_date)
  WHERE status = 'sent';

GRANT SELECT ON public.newsletter_log TO authenticated;
GRANT ALL ON public.newsletter_log TO service_role;

ALTER TABLE public.newsletter_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view newsletter log"
  ON public.newsletter_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
