import { supabase } from '@/integrations/supabase/client';

export interface Coordenador {
  id: string;
  nome: string;
  email?: string | null;
  ativo: boolean;
}

export async function fetchCoordenadores(): Promise<Coordenador[]> {
  const { data, error } = await supabase
    .from('coordenadores')
    .select('*')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function createCoordenador(coord: Omit<Coordenador, 'id'>): Promise<Coordenador> {
  const { data, error } = await supabase
    .from('coordenadores')
    .insert(coord)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCoordenador(id: string, coord: Partial<Coordenador>): Promise<Coordenador> {
  const { data, error } = await supabase
    .from('coordenadores')
    .update(coord)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCoordenador(id: string): Promise<void> {
  const { error } = await supabase
    .from('coordenadores')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}
