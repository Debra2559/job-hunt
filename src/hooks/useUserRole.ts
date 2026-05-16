import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'admin' | 'user';

interface UserRoleState {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function useUserRole(userId: string | undefined) {
  const [state, setState] = useState<UserRoleState>({
    role: null,
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
  });

  const loadRole = useCallback(async () => {
    if (!userId) {
      setState({ role: null, loading: false, isAdmin: false, isSuperAdmin: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }

      const role = (data?.role as AppRole) || null;
      const isSuperAdmin = role === 'super_admin';
      const isAdmin = role === 'admin' || role === 'super_admin';
      
      if (import.meta.env.DEV) {
        console.log('User role loaded:', { userId, role, isAdmin, isSuperAdmin });
      }
      
      setState({
        role,
        loading: false,
        isAdmin,
        isSuperAdmin,
      });
    } catch (error) {
      console.error('Error loading user role:', error);
      setState({ role: null, loading: false, isAdmin: false, isSuperAdmin: false });
    }
  }, [userId]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  return { ...state, refetch: loadRole };
}
