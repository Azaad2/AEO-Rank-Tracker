import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'analyst' | 'agency_admin';

/**
 * Check whether a user has a given role via the database `has_role()` function.
 * Source of truth: public.user_roles (NOT email allowlists).
 */
export async function userHasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: role,
  });
  if (error) {
    console.warn('has_role check failed:', error.message);
    return false;
  }
  return data === true;
}
