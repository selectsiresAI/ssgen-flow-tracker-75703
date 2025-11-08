import { supabase } from '@/integrations/supabase/client';
import type { ServiceOrder, UnifiedOrder } from '@/types/ssgen';

export async function fetchUnifiedOrders(): Promise<UnifiedOrder[]> {
  const { data, error } = await supabase
    .from('vw_orders_unified')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching unified orders:', error);
    return [];
  }
  return data as any as UnifiedOrder[];
}

export async function createServiceOrder(order: Omit<ServiceOrder, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('service_orders')
    .insert([order])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateServiceOrder(id: string, updates: Partial<ServiceOrder>) {
  const { data, error } = await supabase
    .from('service_orders')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteServiceOrder(id: string) {
  const { error } = await supabase.rpc('soft_delete_service_order', {
    p_target_id: id,
  });

  if (error) throw error;
}
