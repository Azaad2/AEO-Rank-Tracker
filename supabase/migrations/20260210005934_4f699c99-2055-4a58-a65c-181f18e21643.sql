
-- Create auto_optimizations table
CREATE TABLE public.auto_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.scans(id),
  content_suggestions JSONB DEFAULT '[]'::jsonb,
  faq_schema TEXT DEFAULT '',
  blog_outlines JSONB DEFAULT '[]'::jsonb,
  meta_rewrites JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_optimizations ENABLE ROW LEVEL SECURITY;

-- Users can only read their own optimizations
CREATE POLICY "Users can view own optimizations"
ON public.auto_optimizations
FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role inserts (edge functions use service role)
CREATE POLICY "Service insert optimizations"
ON public.auto_optimizations
FOR INSERT
WITH CHECK (true);

-- Allow service role updates
CREATE POLICY "Service update optimizations"
ON public.auto_optimizations
FOR UPDATE
USING (true);
