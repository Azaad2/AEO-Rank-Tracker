import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AppRole } from '@/lib/admin';

interface RoleState {
  isAdmin: boolean;
  isAnalyst: boolean;
  isAgencyAdmin: boolean;
  roles: AppRole[];
  loading: boolean;
}

export function useUserRole(): RoleState {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<RoleState>({
    isAdmin: false,
    isAnalyst: false,
    isAgencyAdmin: false,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setState({ isAdmin: false, isAnalyst: false, isAgencyAdmin: false, roles: [], loading: false });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (cancelled) return;
      if (error) {
        setState({ isAdmin: false, isAnalyst: false, isAgencyAdmin: false, roles: [], loading: false });
        return;
      }
      const roles = (data ?? []).map((r) => r.role as AppRole);
      setState({
        isAdmin: roles.includes('admin'),
        isAnalyst: roles.includes('analyst'),
        isAgencyAdmin: roles.includes('agency_admin'),
        roles,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return state;
}
