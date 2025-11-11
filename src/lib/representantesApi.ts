import { supabase } from '@/integrations/supabase/client';

type ProfileResult = {
  role?: string | null;
  coord?: string | null;
  rep?: string | null;
};

export interface Representante {
  id: string;
  nome: string;
  email?: string;
  ativo: boolean;
}

export async function fetchRepresentantes(): Promise<Representante[]> {
  const { data: profileData, error: profileError } = await supabase.rpc('my_profile');
  if (profileError) throw profileError;

  const profile = Array.isArray(profileData) ? profileData[0] : profileData;
  const role = (profile as ProfileResult | null)?.role ?? null;
  const coord = (profile as ProfileResult | null)?.coord ?? null;
  const rep = (profile as ProfileResult | null)?.rep ?? null;

  const baseQuery = supabase
    .from('representantes')
    .select('*')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (role === 'GERENTE' && coord) {
    const { data: coordinatorClients, error: clientsError } = await supabase
      .from('clients')
      .select('representante')
      .eq('coordenador', coord)
      .is('deleted_at', null);

    if (clientsError) throw clientsError;

    const repNames = Array.from(
      new Set((coordinatorClients ?? []).map((client) => client.representante).filter(Boolean)),
    ) as string[];

    if (repNames.length === 0) {
      return [];
    }

    const { data, error } = await baseQuery.in('nome', repNames);
    if (error) throw error;
    return data || [];
  }

  if (role === 'REPRESENTANTE' && rep) {
    const { data, error } = await baseQuery.eq('nome', rep);
    if (error) throw error;
    return data || [];
  }

  const { data, error } = await baseQuery;
  if (error) throw error;
  return data || [];
}

export async function createRepresentante(rep: Omit<Representante, 'id'>): Promise<Representante> {
  const { data, error } = await supabase
    .from('representantes')
    .insert(rep)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateRepresentante(id: string, rep: Partial<Representante>): Promise<Representante> {
  const { data, error } = await supabase
    .from('representantes')
    .update(rep)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRepresentante(id: string): Promise<void> {
  const { error } = await supabase
    .from('representantes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}
