import { supabase } from '@/integrations/supabase/client';
import type { ServiceOrder, UnifiedOrder } from '@/types/ssgen';
import { requireAdmin } from '@/lib/ssgenClient';

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

export async function createServiceOrder(order: Omit<ServiceOrder, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'ordem_servico_ssgen'>) {
  await requireAdmin();
  const { data, error } = await supabase
    .from('service_orders')
    .insert([order as any])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateServiceOrder(id: string, updates: Partial<ServiceOrder>) {
  await requireAdmin();
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
  await requireAdmin();
  const { error } = await supabase
    .from('service_orders')
    .update({ deleted_at: new Date().toISOString() } as Partial<ServiceOrder> & { deleted_at: string })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw error;
}
