import { supabase } from '@/integrations/supabase/client';

export interface ServiceOrderFull {
  id: string;
  ordem_servico_ssgen: number | null;
  ordem_servico_neogen: number | null;
  numero_nf_neogen: number | null;
  numero_amostras: number | null;
  cra_data: string | null;
  envio_planilha_data: string | null;
  vri_data: string | null;
  vri_n_amostras: number | null;
  vri_resolvido_data: string | null;
  lpr_data: string | null;
  lpr_n_amostras: number | null;
  envio_resultados_data: string | null;
  envio_resultados_ordem_id: number | null;
  envio_resultados_previsao: string | null;
  dt_faturamento: string | null;
  dt_receb_resultados: string | null;
  liberacao_data: string | null;
  etapa_atual: string;
  prioridade: string;
  received_at: string | null;
  completed_at: string | null;
  sla_days: number | null;
  cliente_lat: number | null;
  cliente_lon: number | null;
  flag_reagendamento: boolean;
  issue_text: string | null;
  nome_produto: string | null;
  cra_status: string | null;
  envio_planilha_status: string | null;
  envio_resultados_status: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAllServiceOrders(): Promise<ServiceOrderFull[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as ServiceOrderFull[];
}

export async function createServiceOrderNew(order: Partial<ServiceOrderFull>) {
  // Se não tiver ordem_servico_ssgen, pegar próximo número
  let osNumber = order.ordem_servico_ssgen;
  
  if (!osNumber) {
    const { data: nextNum, error: numError } = await supabase
      .rpc('next_ordem_servico_ssgen');
    
    if (numError) throw numError;
    osNumber = nextNum;
  }
  
  const { data, error } = await supabase
    .from('service_orders')
    .insert([{ ...order, ordem_servico_ssgen: osNumber }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateServiceOrderNew(id: string, updates: Partial<ServiceOrderFull>) {
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

export async function deleteServiceOrderNew(id: string) {
  const { error } = await supabase.rpc('soft_delete_service_order', {
    p_target_id: id,
  });

  if (error) throw error;
}

export async function upsertServiceOrderFromExcel(row: any) {
  // Se tiver ordem_servico_ssgen, fazer upsert
  if (row.ordem_servico_ssgen) {
    const { data, error } = await supabase
      .from('service_orders')
      .upsert(row, { onConflict: 'ordem_servico_ssgen' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Senão, criar novo
    return createServiceOrderNew(row);
  }
}
