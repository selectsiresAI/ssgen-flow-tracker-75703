import { supabase } from '@/integrations/supabase/client';
import type { Profile, PowerRow } from '@/types/ssgen';

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
  const { error } = await supabase.rpc('update_order_stage', {
    p_order_id: orderId,
    p_field: field,
    p_value: value,
    p_user: userId ?? null
  });

  if (error) throw error;
}
