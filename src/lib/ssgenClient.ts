import { supabase } from '@/integrations/supabase/client';
import type { Profile, PowerRow } from '@/types/ssgen';
import type { Database } from '@/integrations/supabase/types';

type ServiceOrderColumn = keyof Database['public']['Tables']['service_orders']['Row'];

export const POWER_ROW_TO_SERVICE_ORDER_FIELD: Partial<Record<keyof PowerRow, ServiceOrderColumn>> = {
  DT_CRA: 'cra_data',
  DT_PLAN_NEOGEN: 'envio_planilha_data',
  DT_VRI: 'vri_data',
  DT_LPR: 'lpr_data',
  DT_LR: 'liberacao_data',
  DT_RESULT_SSG: 'envio_resultados_data',
  DT_PREV_RESULT_SSG: 'envio_resultados_previsao',
  DT_FATUR_SSG: 'dt_faturamento',
};

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc('my_profile');
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  // RPC retorna array, pegar primeiro item
  const profile = Array.isArray(data) ? data[0] : data;
  return profile as Profile;
}

export async function fetchOrders(): Promise<PowerRow[]> {
  const { data, error } = await supabase.from('vw_orders_powerbi').select('*');
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return (data as any[]).map((r) => ({ ...r }));
}

export async function fetchUnifiedOrdersForDashboard() {
  const { data, error } = await supabase.from('vw_orders_unified').select('*');
  if (error) {
    console.error('Error fetching unified orders:', error);
    return [];
  }
  return data;
}

export async function persistStage(
  orderId: string,
  field: keyof PowerRow,
  value: string | null,
  userId?: string
) {
  const serviceOrderField = POWER_ROW_TO_SERVICE_ORDER_FIELD[field];

  if (!serviceOrderField) {
    throw new Error(`Campo ${String(field)} não está mapeado para service_orders.`);
  }

  const { error } = await supabase
    .from('service_orders')
    .update({ [serviceOrderField]: value })
    .eq('id', orderId);

  if (error) throw error;
}
