import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'ADM' | 'GERENTE' | 'REPRESENTANTE';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  coord?: string;
  rep?: string;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  role?: AppRole;
  coord?: string;
  rep?: string;
}

export async function fetchUsersWithRoles(): Promise<UserWithRole[]> {
  // Buscar profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('email', { ascending: true });
  
  if (profilesError) throw profilesError;

  // Buscar user_roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');
  
  if (rolesError) throw rolesError;

  // Combinar dados
  const usersWithRoles: UserWithRole[] = profiles.map(profile => {
    const userRole = roles?.find(r => r.user_id === profile.id);
    return {
      id: profile.id,
      email: profile.email,
      role: userRole?.role as AppRole | undefined,
      coord: userRole?.coord,
      rep: userRole?.rep,
    };
  });

  return usersWithRoles;
}

export async function assignUserRole(
  userId: string,
  role: AppRole,
  coord?: string,
  rep?: string
): Promise<void> {
  // Validação client-side
  if (role === 'GERENTE' && (!coord || coord.trim() === '')) {
    throw new Error('GERENTE deve ter um coordenador atribuído');
  }
  
  if (role === 'REPRESENTANTE' && (!rep || rep.trim() === '')) {
    throw new Error('REPRESENTANTE deve ter um representante atribuído');
  }

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Atualizar
    const { error } = await supabase
      .from('user_roles')
      .update({ role, coord, rep })
      .eq('user_id', userId);
    
    if (error) throw error;
  } else {
    // Inserir
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role, coord, rep });
    
    if (error) throw error;
  }
}

export async function removeUserRole(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
}
