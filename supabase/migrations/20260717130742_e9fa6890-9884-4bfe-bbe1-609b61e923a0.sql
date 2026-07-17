
CREATE TABLE IF NOT EXISTS public.prompt_evidence_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text NOT NULL UNIQUE,
  prompt text NOT NULL,
  winner text,
  competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_evidence_hash ON public.prompt_evidence_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_prompt_evidence_updated ON public.prompt_evidence_cache(updated_at DESC);

GRANT SELECT ON public.prompt_evidence_cache TO anon, authenticated;
GRANT ALL ON public.prompt_evidence_cache TO service_role;

ALTER TABLE public.prompt_evidence_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evidence cache public read"
  ON public.prompt_evidence_cache FOR SELECT
  USING (true);

CREATE POLICY "Evidence cache service write"
  ON public.prompt_evidence_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Evidence cache service update"
  ON public.prompt_evidence_cache FOR UPDATE
  USING (true);
