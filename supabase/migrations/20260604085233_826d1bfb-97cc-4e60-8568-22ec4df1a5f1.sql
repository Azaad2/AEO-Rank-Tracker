
-- Enum
CREATE TYPE public.app_role AS ENUM ('admin','analyst','agency_admin');

-- Table
CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Security-definer helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Replace hardcoded-email policies
DROP POLICY IF EXISTS "Admins can view backfill jobs" ON public.backfill_jobs;
DROP POLICY IF EXISTS "Admins can view contributions" ON public.global_intelligence_scan_contributions;

CREATE POLICY "Admins read backfill jobs"
  ON public.backfill_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage backfill jobs"
  ON public.backfill_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read contributions"
  ON public.global_intelligence_scan_contributions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tighten service-role-bypass INSERT policies
DROP POLICY IF EXISTS "Service writes global intelligence" ON public.global_intelligence;
CREATE POLICY "Service writes global intelligence"
  ON public.global_intelligence FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service insert recommendations" ON public.recommendations;
CREATE POLICY "Service inserts recommendations"
  ON public.recommendations FOR INSERT TO service_role
  WITH CHECK (true);

-- Seed admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'hello@aimentionyou.com'
ON CONFLICT (user_id, role) DO NOTHING;
