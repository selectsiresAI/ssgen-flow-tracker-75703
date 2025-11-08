import { supabase } from '@/integrations/supabase/client';

export interface BillingSummary {
  total_ordens_faturadas: number;
  total_amostras_faturadas: number;
  valor_total_faturado: number;
  ticket_medio: number;
  ordens_mes_atual: number;
  faturamento_mes_atual: number;
  total_representantes: number;
  total_coordenadores: number;
}

export interface ReadyToInvoice {
  id: string;
  ordem_servico_ssgen: number;
  ordem_servico_neogen: number;
  envio_resultados_data: string;
  numero_amostras: number;
  nome_produto: string;
  cliente: string;
  cpf_cnpj: number;
  representante: string;
  coordenador: string;
  valor_estimado: number;
  dias_desde_liberacao: number;
  created_at: string;
  updated_at: string;
}

export interface BillingMonthly {
  mes: string;
  mes_label: string;
  total_ordens: number;
  total_amostras: number;
  valor_faturado: number;
}

export interface BillingByRep {
  representante: string;
  total_ordens: number;
  total_amostras: number;
  valor_total: number;
}

export interface BillingByCoord {
  coordenador: string;
  total_ordens: number;
  total_amostras: number;
  valor_total: number;
}

export async function fetchBillingSummary(): Promise<BillingSummary | null> {
  const { data, error } = await supabase
    .from('v_billing_summary' as any)
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching billing summary:', error);
    return null;
  }
  return data as unknown as BillingSummary;
}

export async function fetchReadyToInvoice(): Promise<ReadyToInvoice[]> {
  const { data, error } = await supabase
    .from('v_ready_to_invoice' as any)
    .select('*');
  
  if (error) {
    console.error('Error fetching ready to invoice:', error);
    return [];
  }
  return (data || []) as unknown as ReadyToInvoice[];
}

export async function fetchBillingMonthly(): Promise<BillingMonthly[]> {
  const { data, error } = await supabase
    .from('v_billing_monthly' as any)
    .select('*');
  
  if (error) {
    console.error('Error fetching billing monthly:', error);
    return [];
  }
  return (data || []) as unknown as BillingMonthly[];
}

export async function fetchBillingByRep(): Promise<BillingByRep[]> {
  const { data, error } = await supabase
    .from('v_billing_by_rep' as any)
    .select('*');
  
  if (error) {
    console.error('Error fetching billing by rep:', error);
    return [];
  }
  return (data || []) as unknown as BillingByRep[];
}

export async function fetchBillingByCoord(): Promise<BillingByCoord[]> {
  const { data, error } = await supabase
    .from('v_billing_by_coord' as any)
    .select('*');
  
  if (error) {
    console.error('Error fetching billing by coord:', error);
    return [];
  }
  return (data || []) as unknown as BillingByCoord[];
}

export async function invoiceOrder(orderId: string, dt_faturamento: string): Promise<void> {
  const { error } = await supabase
    .from('service_orders')
    .update({ dt_faturamento } as any)
    .eq('id', orderId)
    .is('deleted_at', null);
  
  if (error) throw error;
}
