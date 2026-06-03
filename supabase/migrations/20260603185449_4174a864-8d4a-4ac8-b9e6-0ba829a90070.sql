
-- Extend citations with asset_type + title for richer intelligence
ALTER TABLE public.citations
  ADD COLUMN IF NOT EXISTS asset_type text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.citations
  DROP CONSTRAINT IF EXISTS citations_asset_type_check;
ALTER TABLE public.citations
  ADD CONSTRAINT citations_asset_type_check
  CHECK (asset_type IS NULL OR asset_type = ANY (ARRAY[
    'comparison_page','listicle','directory_listing','reddit_thread',
    'forum_thread','review_page','blog_article','landing_page',
    'news_article','documentation_page','other'
  ]));

CREATE INDEX IF NOT EXISTS idx_citations_asset_type ON public.citations(asset_type);

-- Extend content_assets: add source_type, title, domain; widen asset_type enum
ALTER TABLE public.content_assets
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS domain text;

ALTER TABLE public.content_assets
  DROP CONSTRAINT IF EXISTS content_assets_asset_type_check;
ALTER TABLE public.content_assets
  ADD CONSTRAINT content_assets_asset_type_check
  CHECK (asset_type = ANY (ARRAY[
    'comparison_page','listicle','directory_listing','reddit_thread',
    'forum_thread','review_page','blog_article','landing_page',
    'news_article','documentation_page','other'
  ]));

CREATE INDEX IF NOT EXISTS idx_content_assets_asset_type ON public.content_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_content_assets_domain ON public.content_assets(domain);

-- Allow content_assets upsert by URL alone for unattributed assets
-- (existing unique is (normalized_brand, url); add a partial unique for url when brand is 'unknown')
-- Skip: we'll always set brand_name (use 'unknown' fallback) so existing unique works.
