import { supabase } from '@/lib/supabaseClient';

export type ManagementOrderRow = {
  id: string;
  ordem_servico_ssgen: number;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  deleted_at: string | null;
};

export async function fetchManagementOrders(): Promise<ManagementOrderRow[]> {
  const { data, error } = await supabase
    .from('v_map_orders')
    .select('id, ordem_servico_ssgen, client_id, client_name, created_at, deleted_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error (v_map_orders):', error);
    throw new Error(error.message);
  }

  return (data ?? []) as ManagementOrderRow[];
}
