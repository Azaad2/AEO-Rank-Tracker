# Role-Based Authorization Foundation

Replace the hardcoded `hello@aimentionyou.com` admin check (used in 2 frontend files, 1 edge function, and 2 RLS policies) with a proper `user_roles` table and `has_role()` security-definer function. Adds `admin`, `analyst`, and `agency_admin` roles for future use.

---

## 1. Current state audit

### Hardcoded-email gates

- `src/lib/admin.ts` → `ADMIN_EMAILS = ['hello@aimentionyou.com']`
- `src/pages/admin/Backfill.tsx` → calls `isAdminUser(user)`
- `supabase/functions/backfill-scans/index.ts` → `ADMIN_EMAIL` constant, compares `user.email`

### Current RLS on the 4 tables in scope


| Table                                    | Policy                              | Cmd                  | Roles         | Predicate                                                     |
| ---------------------------------------- | ----------------------------------- | -------------------- | ------------- | ------------------------------------------------------------- |
| `backfill_jobs`                          | Admins can view backfill jobs       | SELECT               | authenticated | `auth.users.email = 'hello@aimentionyou.com'` ❌ hardcoded     |
| `global_intelligence_scan_contributions` | Admins can view contributions       | SELECT               | authenticated | same hardcoded email ❌                                        |
| `global_intelligence`                    | Global intelligence public readable | SELECT               | public        | `true` ⚠️ intentional (anonymized rollups, public-readable)   |
| `global_intelligence`                    | Service writes global intelligence  | INSERT               | public        | `true` ⚠️ relies on service-role bypass — should be tightened |
| `recommendations`                        | Users view/update/delete own        | SELECT/UPDATE/DELETE | authenticated | `auth.uid() = user_id` ✅ correct, no change                   |
| `recommendations`                        | Service insert recommendations      | INSERT               | public        | `true` ⚠️ relies on service-role bypass                       |


**Findings**

- Two policies (`backfill_jobs`, `contributions`) hardcode the email. **Migrate to `has_role(auth.uid(),'admin')`.**
- `global_intelligence` is intentionally public-readable (anonymized peer data). Keep `SELECT` open; tighten `INSERT` to `service_role` only.
- `recommendations` per-user policies are correct. Tighten its `INSERT` policy similarly.
- No write-side RLS on `backfill_jobs` or `contributions` — only service-role writes (via edge functions). Add explicit admin write policies for future console actions; service role bypasses RLS regardless.

---

## 2. Proposed migration (single file)

```sql
-- 2.1 Enum
CREATE TYPE public.app_role AS ENUM ('admin','analyst','agency_admin');

-- 2.2 Table
CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- 2.3 Grants (auth-only; never expose role list to anon)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

-- 2.4 RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin management of roles happens via service-role only (no admin-self-grant exploit).
-- Edge function or SQL console required to insert/delete role rows.

-- 2.5 Security-definer helper (avoids recursive RLS on user_roles)
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

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- 2.6 Replace hardcoded-email policies
DROP POLICY IF EXISTS "Admins can view backfill jobs"     ON public.backfill_jobs;
DROP POLICY IF EXISTS "Admins can view contributions"     ON public.global_intelligence_scan_contributions;

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

-- 2.7 Tighten existing service-role-bypass INSERT policies
-- (service_role bypasses RLS anyway; restricting to it makes intent explicit and
--  prevents accidental client inserts if grants ever widen.)
DROP POLICY IF EXISTS "Service writes global intelligence" ON public.global_intelligence;
CREATE POLICY "Service writes global intelligence"
  ON public.global_intelligence FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service insert recommendations" ON public.recommendations;
CREATE POLICY "Service inserts recommendations"
  ON public.recommendations FOR INSERT TO service_role
  WITH CHECK (true);

-- 2.8 Data migration: grant admin to the existing hardcoded admin email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'hello@aimentionyou.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

**Notes**

- `recommendations` per-user policies are unchanged.
- `global_intelligence` public-read is unchanged (intentional anonymized exposure).
- No data is destroyed; the seed insert is idempotent.

---

## 3. Code changes (after migration approved)

### `src/lib/admin.ts` — replace allowlist with DB-backed check

```ts
import { supabase } from '@/integrations/supabase/client';
export type AppRole = 'admin' | 'analyst' | 'agency_admin';

export async function userHasRole(userId: string, role: AppRole) {
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: userId, _role: role });
  return !error && data === true;
}
```

### New hook `src/hooks/useUserRole.ts`

Returns `{ isAdmin, isAnalyst, isAgencyAdmin, loading }` — wraps a single `user_roles` select for the current user. Cached per session.

### `src/pages/admin/Backfill.tsx`

Replace `isAdminUser(user)` with `const { isAdmin, loading } = useUserRole()`.

### `src/pages/admin/BulkScan.tsx`

Same swap (already uses hardcoded check or no check — audit and align).

### New `src/components/auth/AdminGuard.tsx`

Wraps `AuthGuard` + role check, for reuse on every future admin page.

### `supabase/functions/backfill-scans/index.ts`

Replace `ADMIN_EMAIL` comparison with:

```ts
const { data: isAdmin } = await sb.rpc('has_role', {
  _user_id: data.user.id, _role: 'admin'
});
if (!isAdmin) return forbidden;
```

Keep the service-role bypass (`token === SERVICE_KEY`) for cron.

### `_shared/` — new `requireRole.ts`

Reusable `requireAdmin(req)` helper so future admin edge functions don't reinvent this.

---

## 4. What's NOT changing

- `recommendations` user policies — already correctly scoped to `auth.uid()`.
- `global_intelligence` public read — intentional anonymized exposure for peer benchmarks.
- Edge functions that already use `SUPABASE_SERVICE_ROLE_KEY` bypass RLS as designed; only the human-auth path is being modernized.
- No removal of `hello@aimentionyou.com` from anywhere except as a hardcoded gate — the email remains the support contact in copy/footer.

---

## 5. Order of operations

1. **You approve the migration** → I run it (creates table, function, seeds your admin row, swaps the 4 policies).
2. **Verify**: `SELECT public.has_role(auth.uid(),'admin')` returns `true` for `hello@aimentionyou.com`.
3. **Code swap**: update `admin.ts`, add `useUserRole`, `AdminGuard`, update Backfill page + edge function.
4. **Smoke test** `/admin/backfill` → expect access; sign in as a non-admin → expect Forbidden.
5. Future: grant additional admins via `INSERT INTO public.user_roles(user_id, role) VALUES (...,'admin');`

---

## 6. Open question

Which account besides `hello@aimentionyou.com` (if any) should also receive `admin` on day one? If just that one, the seed in §2.8 is sufficient. Otherwise, give me the emails and I'll add them to the data migration.  
  
Approved.

Add one additional index:

CREATE INDEX idx_user_roles_role  
ON public.user_roles(role);

Change:

GRANT EXECUTE ON FUNCTION public.has_role(...)  
TO authenticated, anon;

to:

GRANT EXECUTE ON FUNCTION public.has_role(...)  
TO authenticated;

Keep global_intelligence public-readable.

Keep recommendations ownership policies unchanged.

Seed only [hello@aimentionyou.com](mailto:hello@aimentionyou.com) as admin initially.

Proceed with the migration and role-system refactor.