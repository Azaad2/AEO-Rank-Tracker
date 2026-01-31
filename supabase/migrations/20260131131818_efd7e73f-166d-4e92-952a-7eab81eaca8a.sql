-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create guest_scans table for tracking anonymous scans
CREATE TABLE public.guest_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  ip_address TEXT,
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on guest_scans
ALTER TABLE public.guest_scans ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking guest scans)
CREATE POLICY "Allow anonymous insert guest_scans"
ON public.guest_scans
FOR INSERT
WITH CHECK (true);

-- No select allowed from client (server-side validation only)
CREATE POLICY "Deny select guest_scans"
ON public.guest_scans
FOR SELECT
USING (false);

-- Add user_id column to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_guest_scans_fingerprint_date ON public.guest_scans(fingerprint, scan_date);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create free subscription for new user
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now() + INTERVAL '1 month'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and subscription on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Update trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check guest scan limit (for edge function use)
CREATE OR REPLACE FUNCTION public.check_guest_scan_limit(p_fingerprint TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.guest_scans
    WHERE fingerprint = p_fingerprint
    AND scan_date = CURRENT_DATE
  );
$$;