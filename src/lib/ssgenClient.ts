import { supabase } from '@/integrations/supabase/client';
import type { Profile, PowerRow } from '@/types/ssgen';
import type { Database } from '@/integrations/supabase/types';
import { logOrderChange } from '@/lib/orderAuditApi';

type ServiceOrderColumn = keyof Database['public']['Tables']['service_orders']['Row'];
type UnifiedOrderRow = Database['public']['Views']['vw_orders_unified']['Row'];

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

function mapUnifiedRowToPowerRow(row: UnifiedOrderRow): PowerRow {
  return {
    id: row.id ?? undefined,
    OS_SSGEN: row.ordem_servico_ssgen ? String(row.ordem_servico_ssgen) : '',
    DT_SSGEN_OS: row.created_at ?? null,
    COD_SSB: null,
    CLIENTE: row.cliente_nome ?? '',
    LIB_CAD_CLIENTE: null,
    PLAN_SSG: null,
    DT_PLAN_SSG: null,
    PROD_SSG: row.nome_produto ?? null,
    N_AMOSTRAS_SSG: row.numero_amostras ?? null,
    DT_PREV_RESULT_SSG: row.dt_prev_resultado ?? null,
    RESULT_SSG: row.resultado ?? null,
    DT_RESULT_SSG: row.dt_resultado ?? null,
    FATUR_TIPO: row.faturamento_tipo ?? null,
    FATUR_SSG: row.valor_faturamento ?? null,
    DT_FATUR_SSG: row.dt_faturamento ?? null,
    REP: row.representante ?? '',
    COORD: row.coordenador ?? '',
    OS_NEOGEN: row.os_neogen ?? null,
    PROD_NEOGEN: null,
    N_AMOSTRAS_NEOGEN: null,
    DT_CRA: row.dt_cra ?? null,
    PLAN_NEOGEN: row.plano_neogen ?? null,
    DT_PLAN_NEOGEN: row.dt_planilha_neogen ?? null,
    N_VRI: row.n_vri ?? null,
    DT_VRI: row.dt_vri ?? null,
    N_LPR: row.n_lpr ?? null,
    DT_LPR: row.dt_lpr ?? null,
    N_LR: row.n_lr ?? null,
    DT_LR: row.dt_lr ?? null,
    LR_RASTREIO: row.lr_rastreio ?? null,
    NF_NEOGEM: null,
    NF_NA_NEOGEN: null,
    created_at: row.created_at ?? undefined,
    updated_at: undefined,
    prioridade: row.prioridade ?? null,
    flag_reagendamento: row.flag_reagendamento ?? null,
    issue_text: row.issue_text ?? null,
    source_table: row.source_table ?? null,
  };
}

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

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== 'ADM') {
    throw new Error('Apenas administradores podem realizar esta ação.');
  }
  return profile;
}

export async function fetchOrders(): Promise<PowerRow[]> {
  const { data, error } = await supabase.from<UnifiedOrderRow>('vw_orders_unified').select('*');
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return (data ?? []).map((row) => mapUnifiedRowToPowerRow(row as UnifiedOrderRow));
}

export async function fetchUnifiedOrdersForDashboard(): Promise<PowerRow[]> {
  const { data, error } = await supabase.from<UnifiedOrderRow>('vw_orders_unified').select('*');
  if (error) {
    console.error('Error fetching unified orders:', error);
    return [];
  }
  return (data ?? []).map((row) => mapUnifiedRowToPowerRow(row as UnifiedOrderRow));
}

export async function persistStage(
  orderId: string,
  field: keyof PowerRow,
  value: string | null,
  _userId?: string,
  previousValue?: string | null,
) {
  const serviceOrderField = POWER_ROW_TO_SERVICE_ORDER_FIELD[field];

  if (!serviceOrderField) {
    throw new Error(`Campo ${String(field)} não está mapeado para service_orders.`);
  }

  const oldValue = previousValue ?? null;
  const newValue = value ?? null;

  if (oldValue === newValue) {
    return;
  }

  await requireAdmin();

  const { error } = await supabase
    .from('service_orders')
    .update({ [serviceOrderField]: newValue })
    .eq('id', orderId)
    .is('deleted_at', null);

  if (error) throw error;

  await logOrderChange({
    order_id: orderId,
    field_name: serviceOrderField,
    old_value: oldValue,
    new_value: newValue,
  });
}
