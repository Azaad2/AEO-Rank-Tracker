CREATE TABLE public.domain_profiles (
  domain text NOT NULL PRIMARY KEY,
  brand_name text,
  category text,
  description text,
  icp text,
  known_competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetch_ok boolean NOT NULL DEFAULT false,
  source text,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.domain_profiles TO authenticated;
GRANT ALL ON public.domain_profiles TO service_role;

ALTER TABLE public.domain_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read domain profiles"
ON public.domain_profiles FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_domain_profiles_updated_at
BEFORE UPDATE ON public.domain_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();