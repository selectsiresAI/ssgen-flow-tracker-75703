import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KpiOrders {
  total_orders: number;
  open_orders: number;
  closed_orders: number;
  avg_tat_days: number;
  sla_on_time_ratio: number;
  total_samples: number;
  active_clients: number;
  em_processamento: number;
  a_faturar: number;
  concluidas_hoje: number;
}

export interface OrderAging {
  id: string;
  ordem_servico_ssgen: number;
  etapa_atual: string;
  sla_days: number | null;
  received_at: string | null;
  completed_at: string | null;
  etapa_started_at: string;
  aging_days: number;
  overdue: boolean;
  cliente_nome: string | null;
  prioridade?: string;
}

export interface MonthlyBilling {
  month: string;
  total_revenue: number;
  n_invoices: number;
}

export function useKpiOrders() {
  return useQuery({
    queryKey: ['v_kpi_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_kpi_orders' as any)
        .select('*')
        .single();
      
      if (error) throw error;
      return data as unknown as KpiOrders;
    },
    refetchInterval: 30000,
  });
}

export function useOrdersAging() {
  return useQuery({
    queryKey: ['v_orders_aging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_orders_aging' as any)
        .select('*')
        .order('aging_days', { ascending: false });
      
      if (error) throw error;
      return (data as unknown as OrderAging[]) || [];
    },
    refetchInterval: 30000,
  });
}

export function useMonthlyBillingView() {
  return useQuery({
    queryKey: ['v_monthly_billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_monthly_billing' as any)
        .select('*')
        .order('month', { ascending: true });
      
      if (error) throw error;
      return (data as unknown as MonthlyBilling[]) || [];
    },
    refetchInterval: 60000,
  });
}

export function useUpdateOrderStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orderId, 
      etapa, 
      userId 
    }: { 
      orderId: string; 
      etapa: string; 
      userId: string | null;
    }) => {
      // Atualizar etapa na ordem
      const updates: any = { etapa_atual: etapa };
      
      if (etapa === 'Liberada') {
        updates.liberacao_data = new Date().toISOString();
      }
      
      if (etapa === 'Concluída') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', orderId);
      
      if (updateError) throw updateError;
      
      // Registrar no histórico
      const { error: historyError } = await supabase
        .from('service_order_stage_history')
        .insert({
          service_order_id: orderId,
          etapa,
          changed_by: userId,
        });
      
      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['v_kpi_orders'] });
      queryClient.invalidateQueries({ queryKey: ['v_orders_aging'] });
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
    },
  });
}
