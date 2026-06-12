
-- Add classification metadata to scans
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS classification_confidence numeric,
  ADD COLUMN IF NOT EXISTS classification_reasoning text,
  ADD COLUMN IF NOT EXISTS classification_method text;

-- Seed topic_clusters: 4 universal clusters per existing industry
INSERT INTO public.topic_clusters (industry_id, slug, name, description)
SELECT i.id, c.slug, c.name, c.description
FROM public.industries i
CROSS JOIN (VALUES
  ('best-of', 'Best Of / Top Lists', 'Listicles and roundups of top tools'),
  ('comparisons', 'Comparisons & Alternatives', 'X vs Y, alternatives to X'),
  ('pricing', 'Pricing & Plans', 'Cost, pricing tiers, value queries'),
  ('use-cases', 'Use Cases & How-To', 'Use case discovery and how-to queries')
) AS c(slug, name, description)
ON CONFLICT (industry_id, slug) DO NOTHING;

-- Server-side recorder for recommendation outcomes (insert is open via existing policy;
-- this helper captures baseline RSS from proprietary_metrics_cache for the rec's scan).
CREATE OR REPLACE FUNCTION public.record_recommendation_outcome(
  _recommendation_id uuid,
  _success boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_scan uuid;
  v_baseline numeric;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  SELECT scan_id INTO v_scan FROM public.recommendations
    WHERE id = _recommendation_id
      AND (user_id = v_user OR user_id IS NULL);
  IF v_scan IS NULL THEN
    RAISE EXCEPTION 'recommendation not found or not owned';
  END IF;

  SELECT rss INTO v_baseline FROM public.proprietary_metrics_cache
    WHERE scan_id = v_scan
    ORDER BY computed_at DESC NULLS LAST
    LIMIT 1;

  INSERT INTO public.recommendation_outcomes
    (recommendation_id, user_id, baseline_rss, success_flag)
  VALUES
    (_recommendation_id, v_user, v_baseline, _success)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_recommendation_outcome(uuid, boolean) TO authenticated;
