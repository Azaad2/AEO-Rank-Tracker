-- 1. Add columns to global_intelligence
ALTER TABLE public.global_intelligence
  ADD COLUMN IF NOT EXISTS asset_type text,
  ADD COLUMN IF NOT EXISTS authority_score smallint,
  ADD COLUMN IF NOT EXISTS recommendation_position smallint,
  ADD COLUMN IF NOT EXISTS citation_frequency integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS classification_confidence real,
  ADD COLUMN IF NOT EXISTS first_observed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_observed_at timestamptz NOT NULL DEFAULT now();

-- 2. Unique grain for upsert. Use COALESCE-friendly approach via expression index.
-- Postgres treats NULLs as distinct in unique constraints, so we use a unique index on COALESCEd expressions.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gi_grain ON public.global_intelligence (
  COALESCE(industry_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(topic_cluster_id, '00000000-0000-0000-0000-000000000000'::uuid),
  engine,
  COALESCE(winning_brand, ''),
  COALESCE(citation_domain, ''),
  COALESCE(source_type, ''),
  COALESCE(asset_type, ''),
  prompt_template_hash,
  period_start
);

-- 3. Query indexes
CREATE INDEX IF NOT EXISTS idx_gi_industry_asset ON public.global_intelligence (industry_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_gi_industry_source_asset ON public.global_intelligence (industry_id, source_type, asset_type);
CREATE INDEX IF NOT EXISTS idx_gi_brand_asset ON public.global_intelligence (winning_brand, asset_type);
CREATE INDEX IF NOT EXISTS idx_gi_last_observed ON public.global_intelligence (last_observed_at);

-- 4. Update privacy trigger to validate new fields
CREATE OR REPLACE FUNCTION public.enforce_global_intelligence_privacy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  allowed_assets text[] := ARRAY[
    'comparison_page','listicle','directory_listing','reddit_thread',
    'forum_thread','review_page','blog_article','landing_page',
    'news_article','documentation_page','other'
  ];
BEGIN
  IF NEW.prompt_template_hash IS NULL OR length(NEW.prompt_template_hash) = 0 THEN
    RAISE EXCEPTION 'prompt_template_hash is required (privacy)';
  END IF;

  IF NEW.winning_brand IS NOT NULL AND (NEW.winning_brand ~ '@' OR NEW.winning_brand ~ '^https?://') THEN
    RAISE EXCEPTION 'winning_brand must be normalized, not a URL/email';
  END IF;

  IF NEW.citation_domain IS NOT NULL AND NEW.citation_domain ~ '^https?://' THEN
    NEW.citation_domain := regexp_replace(NEW.citation_domain, '^https?://(www\.)?', '');
    NEW.citation_domain := split_part(NEW.citation_domain, '/', 1);
  END IF;

  IF NEW.asset_type IS NOT NULL AND NOT (NEW.asset_type = ANY(allowed_assets)) THEN
    RAISE EXCEPTION 'asset_type % is not in the closed enum', NEW.asset_type;
  END IF;

  IF NEW.authority_score IS NOT NULL THEN
    IF NEW.authority_score < 0 THEN NEW.authority_score := 0; END IF;
    IF NEW.authority_score > 100 THEN NEW.authority_score := 100; END IF;
  END IF;

  IF NEW.recommendation_position IS NOT NULL THEN
    IF NEW.recommendation_position < 1 THEN NEW.recommendation_position := 1; END IF;
    IF NEW.recommendation_position > 50 THEN NEW.recommendation_position := 50; END IF;
  END IF;

  IF NEW.classification_confidence IS NOT NULL THEN
    IF NEW.classification_confidence < 0 THEN NEW.classification_confidence := 0; END IF;
    IF NEW.classification_confidence > 1 THEN NEW.classification_confidence := 1; END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Idempotency marker on scans
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS rolled_up_at timestamptz;
