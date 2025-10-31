import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackerKPIs {
  total_ordens: number;
  total_amostras: number;
  total_clientes: number;
  em_processamento: number;
  a_faturar: number;
  concluidas_hoje: number;
  reagendamentos: number;
  alta_prioridade: number;
  tma_dias: number;
  sla_envio_ok: number;
  sla_vri_ok: number;
  sla_lpr_ok: number;
  sla_envio_res_ok: number;
  sla_envio_atrasado: number;
  sla_vri_atrasado: number;
  sla_lpr_atrasado: number;
  sla_envio_res_atrasado: number;
  pct_sla_envio_ok: number;
  pct_sla_vri_ok: number;
  pct_sla_lpr_ok: number;
  pct_sla_envio_res_ok: number;
}

export function useTrackerKpis() {
  return useQuery({
    queryKey: ['v_tracker_kpi_topline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_tracker_kpi_topline' as any)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching tracker KPIs:', error);
        return null;
      }
      return data as unknown as TrackerKPIs;
    },
    refetchInterval: 30000,
  });
}
