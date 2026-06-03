
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS priority_score numeric,
  ADD COLUMN IF NOT EXISTS difficulty_weight smallint,
  ADD COLUMN IF NOT EXISTS why_this_matters text,
  ADD COLUMN IF NOT EXISTS industry_benchmark jsonb,
  ADD COLUMN IF NOT EXISTS competitor_examples jsonb,
  ADD COLUMN IF NOT EXISTS supporting_asset_types text[],
  ADD COLUMN IF NOT EXISTS recommendation_type text,
  ADD COLUMN IF NOT EXISTS target_metric text,
  ADD COLUMN IF NOT EXISTS projected_metric_delta numeric,
  ADD COLUMN IF NOT EXISTS execution_payload jsonb,
  ADD COLUMN IF NOT EXISTS industry_id uuid,
  ADD COLUMN IF NOT EXISTS generated_by_version text,
  ADD COLUMN IF NOT EXISTS evidence_urls text[],
  ADD COLUMN IF NOT EXISTS novelty_score numeric,
  ADD COLUMN IF NOT EXISTS recurrence_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_seen_scan_id uuid,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_recommendations_user_scan_priority
  ON public.recommendations (user_id, scan_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_type
  ON public.recommendations (user_id, recommendation_type);
