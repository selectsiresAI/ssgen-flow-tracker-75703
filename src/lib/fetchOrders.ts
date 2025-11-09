import { supabase } from '@/integrations/supabase/client';

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

  if (error) throw error;

  return (data ?? []).filter((row) => row.deleted_at == null) as ManagementOrderRow[];
}
