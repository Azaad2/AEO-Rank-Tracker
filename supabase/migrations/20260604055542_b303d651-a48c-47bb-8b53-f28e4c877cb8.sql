
-- Backfill jobs queue
CREATE TABLE public.backfill_jobs (
  scan_id uuid PRIMARY KEY REFERENCES public.scans(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  stage_checksums jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts int NOT NULL DEFAULT 0,
  processed_rows int NOT NULL DEFAULT 0,
  estimated_remaining_rows int,
  error text,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT backfill_jobs_status_check CHECK (status IN (
    'pending','in_progress','citations_done','metrics_done',
    'recs_done','rollup_done','completed','failed','skipped'
  ))
);
CREATE INDEX backfill_jobs_status_idx ON public.backfill_jobs(status);
CREATE INDEX backfill_jobs_updated_idx ON public.backfill_jobs(updated_at DESC);

GRANT SELECT ON public.backfill_jobs TO authenticated;
GRANT ALL ON public.backfill_jobs TO service_role;

ALTER TABLE public.backfill_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backfill jobs"
  ON public.backfill_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'hello@aimentionyou.com')
  );

CREATE TRIGGER trg_backfill_jobs_updated_at
  BEFORE UPDATE ON public.backfill_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contributions ledger: what each scan added to each global_intelligence grain
CREATE TABLE public.global_intelligence_scan_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  grain_key text NOT NULL,
  global_intelligence_id uuid REFERENCES public.global_intelligence(id) ON DELETE SET NULL,
  observation_count int NOT NULL DEFAULT 0,
  citation_frequency int NOT NULL DEFAULT 0,
  contribution_hash text NOT NULL,
  engine_version text NOT NULL,
  contributed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_id, grain_key)
);
CREATE INDEX gisc_grain_idx ON public.global_intelligence_scan_contributions(grain_key);
CREATE INDEX gisc_scan_idx ON public.global_intelligence_scan_contributions(scan_id);

GRANT SELECT ON public.global_intelligence_scan_contributions TO authenticated;
GRANT ALL ON public.global_intelligence_scan_contributions TO service_role;

ALTER TABLE public.global_intelligence_scan_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contributions"
  ON public.global_intelligence_scan_contributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'hello@aimentionyou.com')
  );

-- Seed: enqueue all existing scans as pending
INSERT INTO public.backfill_jobs (scan_id, status)
SELECT id, 'pending' FROM public.scans
ON CONFLICT (scan_id) DO NOTHING;
