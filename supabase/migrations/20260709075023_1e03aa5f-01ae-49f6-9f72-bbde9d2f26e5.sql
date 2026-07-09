
CREATE TABLE public.prompt_hash_display (
  prompt_template_hash text PRIMARY KEY,
  display_text text NOT NULL,
  sample_count int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prompt_hash_display TO anon, authenticated;
GRANT ALL ON public.prompt_hash_display TO service_role;
ALTER TABLE public.prompt_hash_display ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prompt display public read" ON public.prompt_hash_display FOR SELECT USING (true);
CREATE POLICY "Service writes prompt display" ON public.prompt_hash_display FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.prompt_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_label text NOT NULL,
  industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL,
  topic_cluster_id uuid REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  representative_prompt text NOT NULL,
  member_hashes text[] NOT NULL DEFAULT '{}',
  intent text,
  commercial_intent_score smallint DEFAULT 50 CHECK (commercial_intent_score BETWEEN 0 AND 100),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prompt_clusters_industry ON public.prompt_clusters(industry_id);
CREATE INDEX idx_prompt_clusters_members ON public.prompt_clusters USING GIN (member_hashes);
GRANT SELECT ON public.prompt_clusters TO anon, authenticated;
GRANT ALL ON public.prompt_clusters TO service_role;
ALTER TABLE public.prompt_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clusters public read" ON public.prompt_clusters FOR SELECT USING (true);
CREATE POLICY "Service writes clusters" ON public.prompt_clusters FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.prompt_intelligence_daily (
  id bigserial PRIMARY KEY,
  prompt_template_hash text NOT NULL,
  day date NOT NULL,
  industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL,
  scan_count int NOT NULL DEFAULT 0,
  citation_frequency int NOT NULL DEFAULT 0,
  distinct_brands int NOT NULL DEFAULT 0,
  distinct_domains int NOT NULL DEFAULT 0,
  engines text[] NOT NULL DEFAULT '{}',
  top_brands jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_pid_hash_day_ind ON public.prompt_intelligence_daily
  (prompt_template_hash, day, (COALESCE(industry_id, '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE INDEX idx_pid_day ON public.prompt_intelligence_daily(day DESC);
CREATE INDEX idx_pid_industry_day ON public.prompt_intelligence_daily(industry_id, day DESC);
GRANT SELECT ON public.prompt_intelligence_daily TO anon, authenticated;
GRANT ALL ON public.prompt_intelligence_daily TO service_role;
ALTER TABLE public.prompt_intelligence_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Daily intelligence public read" ON public.prompt_intelligence_daily FOR SELECT USING (true);
CREATE POLICY "Service writes daily intelligence" ON public.prompt_intelligence_daily FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.intelligence_provider_flags (
  provider text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  display_name text NOT NULL,
  description text,
  last_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.intelligence_provider_flags TO anon, authenticated;
GRANT ALL ON public.intelligence_provider_flags TO service_role;
ALTER TABLE public.intelligence_provider_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Provider flags public read" ON public.intelligence_provider_flags FOR SELECT USING (true);
CREATE POLICY "Service writes provider flags" ON public.intelligence_provider_flags FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.intelligence_provider_flags (provider, enabled, display_name, description) VALUES
  ('internal_scans', true, 'AI Mention You Scans', 'Anonymized aggregated scan intelligence from all AI Mention You users'),
  ('google_trends', false, 'Google Trends', 'Google Trends signals — coming soon'),
  ('google_autocomplete', false, 'Google Autocomplete', 'Google Autocomplete signals — coming soon'),
  ('people_also_ask', false, 'People Also Ask', 'Google PAA — coming soon'),
  ('reddit', false, 'Reddit', 'Reddit discussions — coming soon'),
  ('quora', false, 'Quora', 'Quora questions — coming soon'),
  ('news', false, 'News', 'News APIs — coming soon'),
  ('community_packs', false, 'Community Prompt Packs', 'User-contributed prompt packs — coming soon');

CREATE TABLE public.market_intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_reports_type_period_ind ON public.market_intelligence_reports
  (report_type, period_start, period_end, (COALESCE(industry_id, '00000000-0000-0000-0000-000000000000'::uuid)));
GRANT SELECT ON public.market_intelligence_reports TO anon, authenticated;
GRANT ALL ON public.market_intelligence_reports TO service_role;
ALTER TABLE public.market_intelligence_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports public read published" ON public.market_intelligence_reports FOR SELECT USING (published = true);
CREATE POLICY "Service writes reports" ON public.market_intelligence_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE VIEW public.prompt_intelligence_trending AS
WITH win AS (
  SELECT
    pid.prompt_template_hash,
    pid.industry_id,
    SUM(CASE WHEN day >= (CURRENT_DATE - INTERVAL '7 days')::date THEN scan_count ELSE 0 END) AS scans_7d,
    SUM(CASE WHEN day BETWEEN (CURRENT_DATE - INTERVAL '14 days')::date AND (CURRENT_DATE - INTERVAL '8 days')::date THEN scan_count ELSE 0 END) AS scans_prev_7d,
    SUM(CASE WHEN day >= (CURRENT_DATE - INTERVAL '30 days')::date THEN scan_count ELSE 0 END) AS scans_30d,
    SUM(CASE WHEN day >= (CURRENT_DATE - INTERVAL '90 days')::date THEN scan_count ELSE 0 END) AS scans_90d,
    SUM(scan_count) AS scans_all,
    SUM(CASE WHEN day >= (CURRENT_DATE - INTERVAL '7 days')::date THEN citation_frequency ELSE 0 END) AS cites_7d,
    SUM(CASE WHEN day BETWEEN (CURRENT_DATE - INTERVAL '14 days')::date AND (CURRENT_DATE - INTERVAL '8 days')::date THEN citation_frequency ELSE 0 END) AS cites_prev_7d,
    MAX(distinct_brands) AS max_distinct_brands,
    MAX(distinct_domains) AS max_distinct_domains,
    MAX(day) AS last_seen_day,
    MIN(day) AS first_seen_day
  FROM public.prompt_intelligence_daily pid
  GROUP BY pid.prompt_template_hash, pid.industry_id
),
enriched AS (
  SELECT
    w.*,
    disp.display_text,
    ind.name AS industry_name,
    ind.slug AS industry_slug,
    CASE
      WHEN w.scans_prev_7d = 0 AND w.scans_7d > 0 THEN 999
      WHEN w.scans_prev_7d = 0 THEN 0
      ELSE ROUND(((w.scans_7d::numeric - w.scans_prev_7d) / w.scans_prev_7d) * 100)::int
    END AS growth_pct,
    CASE
      WHEN w.cites_prev_7d = 0 AND w.cites_7d > 0 THEN 999
      WHEN w.cites_prev_7d = 0 THEN 0
      ELSE ROUND(((w.cites_7d::numeric - w.cites_prev_7d) / w.cites_prev_7d) * 100)::int
    END AS citation_growth_pct,
    GREATEST(0, (CURRENT_DATE - w.last_seen_day)) AS freshness_days
  FROM win w
  LEFT JOIN public.prompt_hash_display disp ON disp.prompt_template_hash = w.prompt_template_hash
  LEFT JOIN public.industries ind ON ind.id = w.industry_id
)
SELECT
  e.prompt_template_hash,
  e.industry_id,
  e.industry_name,
  e.industry_slug,
  e.display_text,
  e.scans_7d, e.scans_prev_7d, e.scans_30d, e.scans_90d, e.scans_all,
  e.cites_7d, e.growth_pct, e.citation_growth_pct,
  e.max_distinct_brands AS competitors_answering,
  e.max_distinct_domains AS domains_cited,
  e.freshness_days,
  e.first_seen_day, e.last_seen_day,
  CASE
    WHEN e.growth_pct >= 50 THEN 'exploding'
    WHEN e.growth_pct >= 10 THEN 'growing'
    WHEN e.growth_pct <= -10 THEN 'declining'
    ELSE 'stable'
  END AS trend_bucket,
  LEAST(100, GREATEST(0,
      LEAST(30, e.scans_7d * 3)
    + LEAST(30, GREATEST(0, e.growth_pct) / 5)
    + LEAST(15, e.cites_7d)
    + CASE WHEN e.max_distinct_brands < 3 THEN 15 WHEN e.max_distinct_brands < 6 THEN 10 ELSE 5 END
    + CASE WHEN e.freshness_days <= 7 THEN 10 WHEN e.freshness_days <= 30 THEN 5 ELSE 0 END
  ))::int AS opportunity_score,
  LEAST(100, ROUND(SQRT(GREATEST(1, e.scans_all)) * 8))::int AS confidence_score,
  jsonb_build_object(
    'scan_delta', e.scans_7d - e.scans_prev_7d,
    'citation_delta', e.cites_7d - e.cites_prev_7d,
    'brands_ranking', e.max_distinct_brands,
    'domains_cited', e.max_distinct_domains,
    'freshness_days', e.freshness_days
  ) AS reasons
FROM enriched e
WHERE e.scans_all >= 2;
GRANT SELECT ON public.prompt_intelligence_trending TO anon, authenticated;

CREATE OR REPLACE VIEW public.first_mover_opportunities AS
SELECT * FROM public.prompt_intelligence_trending
WHERE growth_pct >= 30 AND competitors_answering <= 4 AND scans_7d >= 2 AND freshness_days <= 30
ORDER BY opportunity_score DESC;
GRANT SELECT ON public.first_mover_opportunities TO anon, authenticated;

CREATE OR REPLACE VIEW public.emerging_topics AS
WITH per_hash AS (
  SELECT prompt_template_hash, industry_id,
    SUM(CASE WHEN day >= (CURRENT_DATE - INTERVAL '14 days')::date THEN scan_count ELSE 0 END) AS scans_14d,
    SUM(CASE WHEN day >= (CURRENT_DATE - INTERVAL '30 days')::date THEN scan_count ELSE 0 END) AS scans_30d,
    MAX(day) AS last_day
  FROM public.prompt_intelligence_daily
  GROUP BY prompt_template_hash, industry_id
),
by_cluster AS (
  SELECT
    c.id AS cluster_id,
    c.cluster_label,
    c.industry_id,
    ind.name AS industry_name,
    c.representative_prompt,
    c.intent,
    c.commercial_intent_score,
    SUM(ph.scans_14d) AS scans_14d,
    SUM(ph.scans_30d) AS scans_30d,
    MAX(ph.last_day) AS last_day,
    COUNT(DISTINCT ph.prompt_template_hash) AS prompts_in_cluster
  FROM public.prompt_clusters c
  LEFT JOIN public.industries ind ON ind.id = c.industry_id
  LEFT JOIN per_hash ph ON ph.prompt_template_hash = ANY (c.member_hashes)
  GROUP BY c.id, c.cluster_label, c.industry_id, ind.name, c.representative_prompt, c.intent, c.commercial_intent_score
)
SELECT *,
  CASE WHEN scans_30d = 0 THEN 0 ELSE ROUND(((scans_14d::numeric) / scans_30d) * 100)::int END AS recency_share_pct,
  LEAST(100, GREATEST(0,
      LEAST(40, scans_14d)
    + LEAST(30, prompts_in_cluster * 3)
    + LEAST(30, commercial_intent_score / 3)
  ))::int AS opportunity_score
FROM by_cluster
WHERE scans_14d >= 2
ORDER BY scans_14d DESC;
GRANT SELECT ON public.emerging_topics TO anon, authenticated;

CREATE OR REPLACE VIEW public.industry_intelligence AS
SELECT
  ind.id AS industry_id,
  ind.name AS industry_name,
  ind.slug AS industry_slug,
  COUNT(DISTINCT gi.prompt_template_hash) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days') AS distinct_prompts_30d,
  COALESCE(SUM(gi.observation_count) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '7 days'), 0)::int AS scans_7d,
  COALESCE(SUM(gi.observation_count) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days'), 0)::int AS scans_30d,
  COALESCE(SUM(gi.citation_frequency) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days'), 0)::int AS citations_30d,
  COUNT(DISTINCT gi.winning_brand) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days' AND gi.winning_brand IS NOT NULL) AS distinct_brands_30d,
  COUNT(DISTINCT gi.citation_domain) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days' AND gi.citation_domain IS NOT NULL) AS distinct_domains_30d,
  AVG(gi.authority_score) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days') AS avg_authority_30d
FROM public.industries ind
LEFT JOIN public.global_intelligence gi ON gi.industry_id = ind.id
GROUP BY ind.id, ind.name, ind.slug;
GRANT SELECT ON public.industry_intelligence TO anon, authenticated;

CREATE OR REPLACE VIEW public.competitor_intelligence AS
SELECT
  gi.winning_brand AS brand,
  gi.industry_id,
  ind.name AS industry_name,
  COUNT(DISTINCT gi.prompt_template_hash) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days') AS prompts_won_30d,
  COUNT(DISTINCT gi.engine) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days') AS engines_active,
  COALESCE(SUM(gi.citation_frequency) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days'),0)::int AS citations_30d,
  COALESCE(SUM(gi.observation_count) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days'),0)::int AS observations_30d,
  array_agg(DISTINCT gi.engine) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days') AS engines_list
FROM public.global_intelligence gi
LEFT JOIN public.industries ind ON ind.id = gi.industry_id
WHERE gi.winning_brand IS NOT NULL
GROUP BY gi.winning_brand, gi.industry_id, ind.name
HAVING COALESCE(SUM(gi.observation_count) FILTER (WHERE gi.last_observed_at >= now() - INTERVAL '30 days'),0) >= 2;
GRANT SELECT ON public.competitor_intelligence TO anon, authenticated;

CREATE OR REPLACE VIEW public.market_intelligence_stats AS
SELECT
  (SELECT COUNT(*) FROM public.scans)::bigint AS total_scans,
  (SELECT COUNT(*) FROM public.scans WHERE created_at >= now() - INTERVAL '7 days')::bigint AS scans_7d,
  (SELECT COUNT(DISTINCT industry_id) FROM public.scans WHERE industry_id IS NOT NULL)::bigint AS industries_covered,
  (SELECT COUNT(DISTINCT engine) FROM public.global_intelligence)::bigint AS engines_tracked,
  (SELECT COALESCE(SUM(citation_frequency),0) FROM public.global_intelligence)::bigint AS total_citations,
  (SELECT COUNT(*) FROM public.prompt_intelligence_trending)::bigint AS opportunities_tracked,
  (SELECT COUNT(*) FROM public.prompt_clusters)::bigint AS clusters_discovered,
  (SELECT COUNT(DISTINCT winning_brand) FROM public.global_intelligence WHERE winning_brand IS NOT NULL)::bigint AS brands_tracked,
  (SELECT COUNT(DISTINCT citation_domain) FROM public.global_intelligence WHERE citation_domain IS NOT NULL)::bigint AS domains_tracked,
  now() AS as_of;
GRANT SELECT ON public.market_intelligence_stats TO anon, authenticated;

CREATE TRIGGER update_prompt_hash_display_updated_at BEFORE UPDATE ON public.prompt_hash_display FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prompt_clusters_updated_at BEFORE UPDATE ON public.prompt_clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_flags_updated_at BEFORE UPDATE ON public.intelligence_provider_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
