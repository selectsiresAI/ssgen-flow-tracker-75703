import { supabase } from '@/integrations/supabase/client';

export interface Representante {
  id: string;
  nome: string;
  email?: string | null;
  ativo: boolean;
  coordenador_nome?: string | null;
}

export interface FetchRepresentantesParams {
  coord?: string | null;
  rep?: string | null;
  includeInactive?: boolean;
}

export async function fetchRepresentantes(params?: FetchRepresentantesParams): Promise<Representante[]> {
  const { coord, rep, includeInactive } = params ?? {};

  let query = supabase
    .from('representantes')
    .select('id, nome, email, ativo, coordenador_nome, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (!includeInactive) {
    query = query.eq('ativo', true);
  }

  if (coord) {
    query = query.eq('coordenador_nome', coord);
  }

  if (rep) {
    query = query.eq('nome', rep);
  }

  const { data, error } = await query;

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
