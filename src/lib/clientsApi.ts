import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/ssgen';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('data', { ascending: false });
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data as Client[];
}

export async function createClient(client: Omit<Client, 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateClient(ordem_servico_ssgen: number, updates: Partial<Client>) {
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
    .delete()
    .eq('ordem_servico_ssgen', ordem_servico_ssgen);
  
  if (error) throw error;
}
