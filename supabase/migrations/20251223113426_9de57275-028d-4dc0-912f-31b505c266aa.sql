-- Create A/B test variants table
CREATE TABLE public.ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  variant_value TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_name, variant_key)
);

-- Create A/B test assignments table (tracks which visitor sees which variant)
CREATE TABLE public.ab_test_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, test_name)
);

-- Create A/B test conversions table (tracks conversions per variant)
CREATE TABLE public.ab_test_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  conversion_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_conversions ENABLE ROW LEVEL SECURITY;

-- Create public read policy for variants (need to read variants client-side)
CREATE POLICY "Anyone can read active variants" 
ON public.ab_test_variants 
FOR SELECT 
USING (is_active = true);

-- Create public insert policy for assignments (visitors assign themselves)
CREATE POLICY "Anyone can create assignments" 
ON public.ab_test_assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read their own assignments" 
ON public.ab_test_assignments 
FOR SELECT 
USING (true);

-- Create public insert policy for conversions
CREATE POLICY "Anyone can create conversions" 
ON public.ab_test_conversions 
FOR INSERT 
WITH CHECK (true);

-- Insert initial A/B test variants
-- Headline Test
INSERT INTO public.ab_test_variants (test_name, variant_key, variant_value, weight) VALUES
('headline', 'A', 'AI Search Visibility Checker', 1),
('headline', 'B', 'Is Your Website Visible to AI?', 1),
('headline', 'C', 'See How AI Sees Your Brand', 1);

-- CTA Test
INSERT INTO public.ab_test_variants (test_name, variant_key, variant_value, weight) VALUES
('cta', 'A', 'Run a Free AI Visibility Scan', 1),
('cta', 'B', 'Check My AI Visibility Now', 1),
('cta', 'C', 'Start Free Scan', 1);

-- Create index for faster lookups
CREATE INDEX idx_ab_assignments_session ON public.ab_test_assignments(session_id);
CREATE INDEX idx_ab_conversions_test ON public.ab_test_conversions(test_name, variant_key);