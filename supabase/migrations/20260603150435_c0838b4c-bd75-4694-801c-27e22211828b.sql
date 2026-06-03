
-- =====================================================
-- AI RECOMMENDATION INTELLIGENCE — PHASE 1 SCHEMA
-- =====================================================

-- ---------- Extend existing tables ----------
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS industry_id uuid,
  ADD COLUMN IF NOT EXISTS topic_cluster_id uuid,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

ALTER TABLE public.scan_results
  ADD COLUMN IF NOT EXISTS citation_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS chatgpt_response text,
  ADD COLUMN IF NOT EXISTS chatgpt_mentioned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chatgpt_cited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chatgpt_competitors text[],
  ADD COLUMN IF NOT EXISTS perplexity_response text,
  ADD COLUMN IF NOT EXISTS perplexity_mentioned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS perplexity_cited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS perplexity_competitors text[],
  ADD COLUMN IF NOT EXISTS claude_response text,
  ADD COLUMN IF NOT EXISTS claude_mentioned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS claude_cited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS claude_competitors text[];

-- ---------- industries ----------
CREATE TABLE public.industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.industries(id) ON DELETE SET NULL,
  prompt_seed_pack text[] DEFAULT '{}'::text[],
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.industries TO anon, authenticated;
GRANT ALL ON public.industries TO service_role;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Industries are public readable" ON public.industries FOR SELECT USING (true);

-- ---------- topic_clusters ----------
CREATE TABLE public.topic_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(industry_id, slug)
);
GRANT SELECT ON public.topic_clusters TO anon, authenticated;
GRANT ALL ON public.topic_clusters TO service_role;
ALTER TABLE public.topic_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topic clusters public readable" ON public.topic_clusters FOR SELECT USING (true);

-- ---------- brand_aliases ----------
CREATE TABLE public.brand_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_brand_aliases_canonical ON public.brand_aliases(canonical_name);
GRANT SELECT ON public.brand_aliases TO anon, authenticated;
GRANT ALL ON public.brand_aliases TO service_role;
ALTER TABLE public.brand_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand aliases public readable" ON public.brand_aliases FOR SELECT USING (true);

-- ---------- normalize_brand() helper ----------
CREATE OR REPLACE FUNCTION public.normalize_brand(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cleaned text;
  canonical text;
BEGIN
  IF input IS NULL OR length(trim(input)) = 0 THEN RETURN NULL; END IF;
  cleaned := lower(trim(input));
  cleaned := regexp_replace(cleaned, '^https?://', '', 'i');
  cleaned := regexp_replace(cleaned, '^www\.', '', 'i');
  cleaned := regexp_replace(cleaned, '\.(com|io|co|net|org|ai|app|dev)(/.*)?$', '', 'i');
  cleaned := regexp_replace(cleaned, '\s+(inc|ltd|llc|gmbh|corp|co)\.?$', '', 'i');
  cleaned := trim(cleaned);
  RETURN cleaned;
END;
$$;

-- ---------- citation_sources ----------
CREATE TABLE public.citation_sources (
  domain text PRIMARY KEY,
  domain_type text NOT NULL CHECK (domain_type IN ('reddit','forum','news','blog','directory','review_site','youtube','official','github','social','other')),
  authority_score int NOT NULL DEFAULT 50 CHECK (authority_score BETWEEN 0 AND 100),
  classification_method text NOT NULL DEFAULT 'pattern' CHECK (classification_method IN ('pattern','llm','manual')),
  classified_at timestamptz NOT NULL DEFAULT now(),
  authority_refreshed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX idx_citation_sources_type ON public.citation_sources(domain_type);
GRANT SELECT ON public.citation_sources TO anon, authenticated;
GRANT ALL ON public.citation_sources TO service_role;
ALTER TABLE public.citation_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citation sources public readable" ON public.citation_sources FOR SELECT USING (true);
CREATE POLICY "Service writes citation sources" ON public.citation_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Service updates citation sources" ON public.citation_sources FOR UPDATE USING (true);

-- ---------- citations ----------
CREATE TABLE public.citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_result_id bigint NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
  engine text NOT NULL CHECK (engine IN ('gemini','chatgpt','perplexity','claude','overviews','search')),
  url text NOT NULL,
  domain text NOT NULL,
  source_type text,
  cites_brand text,
  position int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_citations_scan_result ON public.citations(scan_result_id);
CREATE INDEX idx_citations_domain ON public.citations(domain);
CREATE INDEX idx_citations_brand ON public.citations(cites_brand);
GRANT SELECT, INSERT ON public.citations TO anon, authenticated;
GRANT ALL ON public.citations TO service_role;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citations public readable" ON public.citations FOR SELECT USING (true);
CREATE POLICY "Citations public insert" ON public.citations FOR INSERT WITH CHECK (true);

-- ---------- brand_observations ----------
CREATE TABLE public.brand_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_result_id bigint NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  normalized_name text NOT NULL,
  is_customer_brand boolean NOT NULL DEFAULT false,
  position int,
  cited boolean DEFAULT false,
  engine text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_brand_obs_scan_result ON public.brand_observations(scan_result_id);
CREATE INDEX idx_brand_obs_normalized ON public.brand_observations(normalized_name);
CREATE INDEX idx_brand_obs_engine ON public.brand_observations(engine);
GRANT SELECT, INSERT ON public.brand_observations TO anon, authenticated;
GRANT ALL ON public.brand_observations TO service_role;
ALTER TABLE public.brand_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand observations public readable" ON public.brand_observations FOR SELECT USING (true);
CREATE POLICY "Brand observations public insert" ON public.brand_observations FOR INSERT WITH CHECK (true);

-- ---------- content_assets ----------
CREATE TABLE public.content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  normalized_brand text NOT NULL,
  url text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('comparison_page','listicle','directory_listing','reddit_thread','forum_thread','review_page','blog_article','landing_page','news_article','other')),
  industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL,
  citation_count int NOT NULL DEFAULT 1,
  authority_score int DEFAULT 50,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE(normalized_brand, url)
);
CREATE INDEX idx_content_assets_brand ON public.content_assets(normalized_brand);
CREATE INDEX idx_content_assets_industry ON public.content_assets(industry_id);
GRANT SELECT ON public.content_assets TO anon, authenticated;
GRANT ALL ON public.content_assets TO service_role;
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content assets public readable" ON public.content_assets FOR SELECT USING (true);
CREATE POLICY "Content assets public insert" ON public.content_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Content assets public update" ON public.content_assets FOR UPDATE USING (true);

-- ---------- proprietary_metrics_cache ----------
CREATE TABLE public.proprietary_metrics_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  rss numeric,
  cag numeric,
  tsd numeric,
  cis_top jsonb DEFAULT '[]'::jsonb,
  coi jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scan_id)
);
CREATE INDEX idx_metrics_cache_scan ON public.proprietary_metrics_cache(scan_id);
GRANT SELECT, INSERT, UPDATE ON public.proprietary_metrics_cache TO anon, authenticated;
GRANT ALL ON public.proprietary_metrics_cache TO service_role;
ALTER TABLE public.proprietary_metrics_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metrics cache public readable" ON public.proprietary_metrics_cache FOR SELECT USING (true);
CREATE POLICY "Metrics cache public insert" ON public.proprietary_metrics_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Metrics cache public update" ON public.proprietary_metrics_cache FOR UPDATE USING (true);

-- ---------- recommendations ----------
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  evidence jsonb NOT NULL,
  expected_impact int NOT NULL DEFAULT 0,
  confidence int NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  time_estimate_minutes int,
  category text NOT NULL CHECK (category IN ('citation','content','authority','comparison','technical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','dismissed')),
  tool_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT evidence_not_empty CHECK (jsonb_typeof(evidence) = 'object' AND evidence <> '{}'::jsonb)
);
CREATE INDEX idx_recommendations_user ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_scan ON public.recommendations(scan_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own recommendations" ON public.recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own recommendations" ON public.recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own recommendations" ON public.recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service insert recommendations" ON public.recommendations FOR INSERT WITH CHECK (true);

-- ---------- engine_weights ----------
CREATE TABLE public.engine_weights (
  engine text PRIMARY KEY,
  weight numeric NOT NULL CHECK (weight >= 0 AND weight <= 1),
  last_updated timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.engine_weights TO anon, authenticated;
GRANT ALL ON public.engine_weights TO service_role;
ALTER TABLE public.engine_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Engine weights public readable" ON public.engine_weights FOR SELECT USING (true);

-- ---------- global_intelligence (the moat) ----------
CREATE TABLE public.global_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid REFERENCES public.industries(id) ON DELETE SET NULL,
  topic_cluster_id uuid REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  engine text NOT NULL,
  winning_brand text,
  citation_domain text,
  source_type text,
  prompt_template_hash text NOT NULL,
  observation_count int NOT NULL DEFAULT 1,
  period_start timestamptz NOT NULL DEFAULT date_trunc('day', now()),
  period_end timestamptz NOT NULL DEFAULT date_trunc('day', now()) + interval '1 day',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gi_industry ON public.global_intelligence(industry_id);
CREATE INDEX idx_gi_engine ON public.global_intelligence(engine);
CREATE INDEX idx_gi_brand ON public.global_intelligence(winning_brand);
CREATE INDEX idx_gi_domain ON public.global_intelligence(citation_domain);
CREATE INDEX idx_gi_period ON public.global_intelligence(period_start);

-- Privacy trigger: enforce no customer identifiers leak in
CREATE OR REPLACE FUNCTION public.enforce_global_intelligence_privacy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.prompt_template_hash IS NULL OR length(NEW.prompt_template_hash) = 0 THEN
    RAISE EXCEPTION 'prompt_template_hash is required (privacy)';
  END IF;
  -- Block anything looking like a raw URL or email leaking through
  IF NEW.winning_brand ~ '@' OR NEW.winning_brand ~ '^https?://' THEN
    RAISE EXCEPTION 'winning_brand must be normalized, not a URL/email';
  END IF;
  IF NEW.citation_domain ~ '^https?://' THEN
    NEW.citation_domain := regexp_replace(NEW.citation_domain, '^https?://(www\.)?', '');
    NEW.citation_domain := split_part(NEW.citation_domain, '/', 1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_global_intelligence_privacy
BEFORE INSERT OR UPDATE ON public.global_intelligence
FOR EACH ROW EXECUTE FUNCTION public.enforce_global_intelligence_privacy();

GRANT SELECT ON public.global_intelligence TO anon, authenticated;
GRANT ALL ON public.global_intelligence TO service_role;
ALTER TABLE public.global_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global intelligence public readable" ON public.global_intelligence FOR SELECT USING (true);
CREATE POLICY "Service writes global intelligence" ON public.global_intelligence FOR INSERT WITH CHECK (true);

-- ---------- industry_leaderboard ----------
CREATE TABLE public.industry_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  topic_cluster_id uuid REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  period date NOT NULL DEFAULT CURRENT_DATE,
  brand text NOT NULL,
  rss numeric NOT NULL DEFAULT 0,
  citation_authority_score numeric DEFAULT 0,
  trust_source_density numeric DEFAULT 0,
  recommendation_strength numeric DEFAULT 0,
  rank int NOT NULL DEFAULT 0,
  delta_vs_previous numeric DEFAULT 0,
  observation_count int NOT NULL DEFAULT 0,
  top_sources jsonb DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(industry_id, period, brand)
);
CREATE INDEX idx_leaderboard_industry_period ON public.industry_leaderboard(industry_id, period DESC);
CREATE INDEX idx_leaderboard_rank ON public.industry_leaderboard(industry_id, period, rank);
GRANT SELECT ON public.industry_leaderboard TO anon, authenticated;
GRANT ALL ON public.industry_leaderboard TO service_role;
ALTER TABLE public.industry_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard public readable" ON public.industry_leaderboard FOR SELECT USING (true);

-- ---------- recommendation_outcomes ----------
CREATE TABLE public.recommendation_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  baseline_rss numeric,
  rss_after_14_days numeric,
  rss_after_30_days numeric,
  actual_impact numeric,
  success_flag boolean,
  measured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rec_outcomes_user ON public.recommendation_outcomes(user_id);
CREATE INDEX idx_rec_outcomes_rec ON public.recommendation_outcomes(recommendation_id);
GRANT SELECT, INSERT ON public.recommendation_outcomes TO authenticated;
GRANT ALL ON public.recommendation_outcomes TO service_role;
ALTER TABLE public.recommendation_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own outcomes" ON public.recommendation_outcomes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service insert outcomes" ON public.recommendation_outcomes FOR INSERT WITH CHECK (true);

-- ---------- Seed: engine weights ----------
INSERT INTO public.engine_weights (engine, weight) VALUES
  ('chatgpt', 0.40),
  ('gemini', 0.30),
  ('perplexity', 0.20),
  ('claude', 0.10)
ON CONFLICT (engine) DO NOTHING;

-- ---------- Seed: 10 launch industries ----------
INSERT INTO public.industries (slug, name, description, prompt_seed_pack) VALUES
  ('crm', 'CRM', 'Customer relationship management platforms', ARRAY['best CRM software','top CRM for small business','best CRM for sales teams','CRM alternatives to Salesforce','best free CRM','CRM with email marketing','best CRM 2026']),
  ('email-marketing', 'Email Marketing', 'Email marketing and newsletter platforms', ARRAY['best email marketing software','top newsletter platforms','best email marketing for ecommerce','Mailchimp alternatives','best free email marketing tool','best transactional email service']),
  ('project-management', 'Project Management', 'Project management and team collaboration tools', ARRAY['best project management software','top PM tools for agencies','best project management for remote teams','Asana alternatives','best free project management tool','best PM for software teams']),
  ('ecommerce-platforms', 'Ecommerce Platforms', 'Online store and ecommerce platforms', ARRAY['best ecommerce platform','top Shopify alternatives','best ecommerce for small business','WooCommerce vs Shopify','best headless commerce platform']),
  ('help-desk', 'Help Desk', 'Customer support and help desk software', ARRAY['best help desk software','top customer support tools','Zendesk alternatives','best help desk for startups','best free help desk software']),
  ('website-builders', 'Website Builders', 'No-code website and landing page builders', ARRAY['best website builder','top no-code website builder','Webflow alternatives','best landing page builder','best website builder for small business']),
  ('marketing-automation', 'Marketing Automation', 'Marketing automation platforms', ARRAY['best marketing automation software','top marketing automation for B2B','HubSpot alternatives','best marketing automation for ecommerce']),
  ('ai-writing-tools', 'AI Writing Tools', 'AI content and writing assistants', ARRAY['best AI writing tool','top AI content generator','Jasper alternatives','best AI writer for SEO','best free AI writing tool']),
  ('accounting-software', 'Accounting Software', 'Accounting and bookkeeping platforms', ARRAY['best accounting software','top accounting software for small business','QuickBooks alternatives','best accounting for freelancers','best free accounting software']),
  ('team-communication', 'Team Communication', 'Team messaging and collaboration platforms', ARRAY['best team communication tool','top Slack alternatives','best team chat for remote work','best async communication tool','best team messaging app'])
ON CONFLICT (slug) DO NOTHING;

-- ---------- Seed: citation source patterns for common high-authority domains ----------
INSERT INTO public.citation_sources (domain, domain_type, authority_score, classification_method) VALUES
  ('reddit.com', 'reddit', 90, 'pattern'),
  ('news.ycombinator.com', 'forum', 88, 'pattern'),
  ('producthunt.com', 'directory', 78, 'pattern'),
  ('g2.com', 'review_site', 92, 'pattern'),
  ('capterra.com', 'review_site', 88, 'pattern'),
  ('trustpilot.com', 'review_site', 80, 'pattern'),
  ('getapp.com', 'review_site', 78, 'pattern'),
  ('softwareadvice.com', 'review_site', 76, 'pattern'),
  ('youtube.com', 'youtube', 85, 'pattern'),
  ('github.com', 'github', 88, 'pattern'),
  ('medium.com', 'blog', 70, 'pattern'),
  ('techcrunch.com', 'news', 90, 'pattern'),
  ('forbes.com', 'news', 88, 'pattern'),
  ('theverge.com', 'news', 84, 'pattern'),
  ('wired.com', 'news', 82, 'pattern'),
  ('zapier.com', 'blog', 85, 'pattern'),
  ('hubspot.com', 'blog', 88, 'pattern'),
  ('quora.com', 'forum', 72, 'pattern'),
  ('stackoverflow.com', 'forum', 90, 'pattern'),
  ('linkedin.com', 'social', 80, 'pattern'),
  ('twitter.com', 'social', 70, 'pattern'),
  ('x.com', 'social', 70, 'pattern')
ON CONFLICT (domain) DO NOTHING;
