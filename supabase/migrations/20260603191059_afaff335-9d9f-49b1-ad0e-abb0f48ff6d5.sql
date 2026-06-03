
ALTER TABLE public.proprietary_metrics_cache
  ADD COLUMN IF NOT EXISTS rss_breakdown jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cag_breakdown jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tsd_breakdown jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS previous_scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deltas jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS explanation jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS narrative text,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS sample_size jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_metrics_cache_previous
  ON public.proprietary_metrics_cache(previous_scan_id);
