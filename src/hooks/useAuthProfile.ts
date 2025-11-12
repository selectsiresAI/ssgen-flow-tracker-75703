import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Role } from '@/types/ssgen';

export type AuthProfile = {
  userId: string;
  role: Role;
  managerOfRepIds: string[];
  repOfClientIds: string[];
};

const DEFAULT_PROFILE: AuthProfile = {
  userId: '',
  role: 'REPRESENTANTE',
  managerOfRepIds: [],
  repOfClientIds: [],
};

export function useAuthProfile() {
  return useQuery<AuthProfile | null>({
    queryKey: ['auth-profile'],
    staleTime: 60_000,
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) return null;

      const userId = user.id;

      const [userRowResult, managerRowsResult, repsRowsResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, role')
          .eq('id', userId)
          .maybeSingle<Database['public']['Tables']['users']['Row']>(),
        supabase
          .from('managers_reps')
          .select('rep_id')
          .eq('manager_id', userId),
        supabase
          .from('reps_clients')
          .select('client_id')
          .eq('rep_id', userId),
      ]);

      if (userRowResult.error) throw userRowResult.error;
      if (managerRowsResult.error) throw managerRowsResult.error;
      if (repsRowsResult.error) throw repsRowsResult.error;

      const role = (userRowResult.data?.role as Role | undefined) ?? DEFAULT_PROFILE.role;
      const managerOfRepIds = (managerRowsResult.data ?? []).map(
        (row: Pick<Database['public']['Tables']['managers_reps']['Row'], 'rep_id'>) => row.rep_id,
      );
      const repOfClientIds = (repsRowsResult.data ?? []).map(
        (row: Pick<Database['public']['Tables']['reps_clients']['Row'], 'client_id'>) => row.client_id,
      );

      return {
        userId,
        role,
        managerOfRepIds,
        repOfClientIds,
      } satisfies AuthProfile;
    },
  });
}

