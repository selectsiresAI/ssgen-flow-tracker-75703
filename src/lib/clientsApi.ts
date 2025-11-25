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
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
> & {
  ordem_servico_ssgen?: number | null;
};

export async function createClient(client: NewClientPayload) {
  const { ordem_servico_ssgen, ...rest } = client;
  const payload = {
    ...rest,
    ordem_servico_ssgen: ordem_servico_ssgen ?? null,
  };

  const { data, error } = await supabase
    .from('clients')
    .insert([payload])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

type UpdateClientPayload = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;

export async function updateClient(clientId: string, updates: UpdateClientPayload) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(clientId: string) {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clientId);
  
  if (error) throw error;
}
