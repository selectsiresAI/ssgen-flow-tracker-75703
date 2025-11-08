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
  const deletedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('service_orders')
    .update({ deleted_at: deletedAt })
    .eq('id', id)
    .is('deleted_at', null)
    .select('ordem_servico_ssgen')
    .maybeSingle();

  if (error) throw error;

  if (data?.ordem_servico_ssgen) {
    const { error: orderError } = await supabase
      .from('orders')
      .update({ deleted_at: deletedAt })
      .eq('os_ssgen', String(data.ordem_servico_ssgen))
      .is('deleted_at', null);

    if (orderError) throw orderError;
  } else {
    const { error: orderError } = await supabase
      .from('orders')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .is('deleted_at', null);

    if (orderError) throw orderError;
  }
}
