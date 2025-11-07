import { supabase } from '@/integrations/supabase/client';

export interface Representante {
  id: string;
  nome: string;
  email?: string;
  ativo: boolean;
}

export async function fetchRepresentantes(): Promise<Representante[]> {
  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });
  
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
