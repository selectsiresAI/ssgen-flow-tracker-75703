import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Role } from '@/types/ssgen';

export type AuthProfile = {
  userId: string;
  role: Role;
  coord?: string | null;
  rep?: string | null;
};

const DEFAULT_PROFILE: AuthProfile = {
  userId: '',
  role: 'REPRESENTANTE',
  coord: null,
  rep: null,
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

      // Use RPC function to get user profile with role
      const { data, error } = await supabase.rpc('my_profile');

      if (error) throw error;

      const profile = Array.isArray(data) ? data[0] : data;

      if (!profile) return null;

      return {
        userId,
        role: (profile.role as Role) ?? DEFAULT_PROFILE.role,
        coord: profile.coord ?? null,
        rep: profile.rep ?? null,
      } satisfies AuthProfile;
    },
  });
}

