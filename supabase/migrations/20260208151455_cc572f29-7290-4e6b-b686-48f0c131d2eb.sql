
-- Add user_id column to scans table
ALTER TABLE public.scans ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX idx_scans_user_id ON public.scans(user_id);

-- Create saved_domains table
CREATE TABLE public.saved_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

ALTER TABLE public.saved_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domains"
  ON public.saved_domains FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create optimization_tasks table
CREATE TABLE public.optimization_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.scans(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  tool_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.optimization_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON public.optimization_tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for optimization_tasks lookups
CREATE INDEX idx_optimization_tasks_user_id ON public.optimization_tasks(user_id);
CREATE INDEX idx_optimization_tasks_scan_id ON public.optimization_tasks(scan_id);
