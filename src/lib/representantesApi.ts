import { supabase } from '@/integrations/supabase/client';

export interface Representante {
  id: string;
  nome: string;
  email?: string | null;
  ativo: boolean;
  coordenador_id: string | null;
  coordenador?: {
    id: string;
    nome: string;
    email?: string | null;
  } | null;
}

type RepresentantePayload = Omit<Representante, 'id' | 'coordenador'>;

export async function fetchRepresentantes(): Promise<Representante[]> {
  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });
  
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    ativo: r.ativo,
    coordenador_id: r.coordenador_id || null
  }));
}

export async function createRepresentante(rep: RepresentantePayload): Promise<Representante> {
  const { data, error } = await supabase
    .from('representantes')
    .insert(rep as any)
    .select('*')
    .single();
  
  if (error) throw error;
  const result: any = data;
  return {
    id: result.id,
    nome: result.nome,
    email: result.email,
    ativo: result.ativo,
    coordenador_id: result.coordenador_id || null
  };
}

export async function updateRepresentante(
  id: string,
  rep: Partial<RepresentantePayload>,
): Promise<Representante> {
  const { data, error } = await supabase
    .from('representantes')
    .update(rep as any)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) throw error;
  const result: any = data;
  return {
    id: result.id,
    nome: result.nome,
    email: result.email,
    ativo: result.ativo,
    coordenador_id: result.coordenador_id || null
  };
}

export async function deleteRepresentante(id: string): Promise<void> {
  const { error } = await supabase
    .from('representantes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}
