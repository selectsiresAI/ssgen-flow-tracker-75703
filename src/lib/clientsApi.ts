import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/ssgen';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .order('data', { ascending: false });
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data as Client[];
}

type NewClientPayload = Omit<
  Client,
  'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'ordem_servico_ssgen'
> & {
  ordem_servico_ssgen?: number;
};

export async function createClient(client: NewClientPayload) {
  const { ordem_servico_ssgen, ...rest } = client;
  const payload =
    ordem_servico_ssgen !== undefined ? { ordem_servico_ssgen, ...rest } : rest;

  const { data, error } = await supabase
    .from('clients')
    .insert([payload])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateClient(ordem_servico_ssgen: number, updates: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('ordem_servico_ssgen', ordem_servico_ssgen)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteClient(ordem_servico_ssgen: number) {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('ordem_servico_ssgen', ordem_servico_ssgen);
  
  if (error) throw error;
}
