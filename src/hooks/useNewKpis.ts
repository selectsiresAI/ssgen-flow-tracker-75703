import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchOrders as fetchUnifiedOrderRows } from '@/lib/ssgenClient';

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

const toNumber = (value: number | string | null | undefined) => {
  if (value == null) return 0;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export function useKpiOrders() {
  return useQuery({
    queryKey: ['v_kpi_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_kpi_orders' as any)
        .select('*')
        .maybeSingle();

      if (error) throw error;

      const response = data ?? {};

      return {
        total_orders: toNumber(response.total_orders),
        open_orders: toNumber(response.open_orders),
        closed_orders: toNumber(response.closed_orders),
        avg_tat_days: toNumber(response.avg_tat_days),
        sla_on_time_ratio: toNumber(response.sla_on_time_ratio),
        total_samples: toNumber(response.total_samples),
        active_clients: toNumber(response.active_clients),
        em_processamento: toNumber(response.em_processamento),
        a_faturar: toNumber(response.a_faturar),
        concluidas_hoje: toNumber(response.concluidas_hoje),
      } as KpiOrders;
    },
    refetchInterval: 30000,
  });
}

export function useOrdersAging() {
  return useQuery({
    queryKey: ['orders_aging_unified'],
    queryFn: async () => {
      const rawOrders = await fetchUnifiedOrderRows();
      const ordersData = [...rawOrders].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      }).map((o) => {
        // Calculate aging based on most recent stage
        const stages = [
          o.DT_FATUR_SSG,
          o.DT_RESULT_SSG,
          o.DT_LR,
          o.DT_LPR,
          o.DT_VRI,
          o.DT_PLAN_NEOGEN,
          o.DT_CRA,
          o.DT_SSGEN_OS
        ].filter(Boolean);
        
        const mostRecentStage = stages.length > 0 ? stages[0] : o.created_at;
        const agingMs = Date.now() - new Date(mostRecentStage).getTime();
        const aging_days = agingMs / (1000 * 60 * 60 * 24);
        
        // Determine current stage
        let etapa_atual = 'Recebida';
        if (o.DT_FATUR_SSG) etapa_atual = 'Faturada';
        else if (o.DT_RESULT_SSG) etapa_atual = 'Resultados Enviados';
        else if (o.DT_LR) etapa_atual = 'LR';
        else if (o.DT_LPR) etapa_atual = 'LPR';
        else if (o.DT_VRI) etapa_atual = 'VRI';
        else if (o.DT_PLAN_NEOGEN) etapa_atual = 'Planilha Enviada';
        else if (o.DT_CRA) etapa_atual = 'CRA';
        
        const overdue = aging_days > 15; // Consider 15 days as threshold
        
        return {
          id: o.id,
          ordem_servico_ssgen: Number(o.OS_SSGEN) || 0,
          etapa_atual,
          sla_days: 15,
          received_at: o.DT_SSGEN_OS,
          completed_at: o.DT_FATUR_SSG,
          etapa_started_at: mostRecentStage,
          aging_days,
          overdue,
          cliente_nome: o.CLIENTE,
          prioridade: 'media',
        };
      });
      
      return ordersData as OrderAging[];
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
