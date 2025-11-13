import { supabase } from '@/integrations/supabase/client';
import type { Profile, PowerRow } from '@/types/ssgen';
import type { Database } from '@/integrations/supabase/types';
import { logOrderChange } from '@/lib/orderAuditApi';

type ServiceOrderRow = Database['public']['Tables']['service_orders']['Row'];
type OrdersRow = Database['public']['Tables']['orders']['Row'];
type ClientRow = Pick<Database['public']['Tables']['clients']['Row'], 'nome' | 'coordenador' | 'representante' | 'deleted_at'>;

type ServiceOrderWithClient = ServiceOrderRow & {
  clients?: ClientRow | ClientRow[] | null;
};

type ServiceOrderColumn = keyof Database['public']['Tables']['service_orders']['Row'];

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

function pickClient(row: ServiceOrderWithClient): ClientRow | null {
  if (!row.clients) return null;
  if (Array.isArray(row.clients)) {
    return row.clients.find((client) => !client.deleted_at) ?? row.clients[0] ?? null;
  }
  return row.clients.deleted_at ? null : row.clients;
}

function mapServiceOrderRow(row: ServiceOrderWithClient): PowerRow {
  const client = pickClient(row);

  return {
    id: row.id ?? undefined,
    OS_SSGEN: row.ordem_servico_ssgen ? String(row.ordem_servico_ssgen) : '',
    DT_SSGEN_OS: row.received_at ?? row.created_at ?? null,
    COD_SSB: null,
    CLIENTE: client?.nome ?? '',
    LIB_CAD_CLIENTE: null,
    PLAN_SSG: null,
    DT_PLAN_SSG: null,
    PROD_SSG: row.nome_produto ?? null,
    N_AMOSTRAS_SSG: row.numero_amostras ?? null,
    DT_PREV_RESULT_SSG: row.envio_resultados_previsao ?? null,
    RESULT_SSG: row.envio_resultados_status ?? null,
    DT_RESULT_SSG: row.envio_resultados_data ?? null,
    FATUR_TIPO: null,
    FATUR_SSG: null,
    DT_FATUR_SSG: row.dt_faturamento ?? null,
    REP: client?.representante ?? '',
    COORD: client?.coordenador ?? '',
    OS_NEOGEN: row.ordem_servico_neogen ? String(row.ordem_servico_neogen) : null,
    PROD_NEOGEN: null,
    N_AMOSTRAS_NEOGEN: null,
    DT_CRA: row.cra_data ?? null,
    PLAN_NEOGEN: row.envio_planilha_status ?? null,
    DT_PLAN_NEOGEN: row.envio_planilha_data ?? null,
    N_VRI: row.vri_n_amostras ?? null,
    DT_VRI: row.vri_data ?? null,
    N_LPR: row.lpr_n_amostras ?? null,
    DT_LPR: row.lpr_data ?? null,
    N_LR: row.liberacao_n_amostras ?? null,
    DT_LR: row.liberacao_data ?? null,
    LR_RASTREIO: null,
    NF_NEOGEM: null,
    NF_NA_NEOGEN: null,
    result_file_path: row.result_file_path ?? null,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    prioridade: row.prioridade ?? null,
    flag_reagendamento: row.flag_reagendamento ?? null,
    issue_text: row.issue_text ?? null,
    source_table: 'service_orders',
  };
}

function mapLegacyOrderRow(row: OrdersRow): PowerRow {
  return {
    id: row.id ?? undefined,
    OS_SSGEN: row.os_ssgen ? String(row.os_ssgen) : '',
    DT_SSGEN_OS: row.dt_ssgen_os ?? null,
    COD_SSB: row.cod_ssb ?? null,
    CLIENTE: row.cliente ?? '',
    LIB_CAD_CLIENTE: row.lib_cad_cliente ?? null,
    PLAN_SSG: row.plan_ssg ?? null,
    DT_PLAN_SSG: row.dt_plan_ssg ?? null,
    PROD_SSG: row.prod_ssg ?? null,
    N_AMOSTRAS_SSG: row.n_amostras_ssg ?? null,
    DT_PREV_RESULT_SSG: row.dt_prev_result_ssg ?? null,
    RESULT_SSG: row.result_ssg ?? null,
    DT_RESULT_SSG: row.dt_result_ssg ?? null,
    FATUR_TIPO: row.fatur_tipo ?? null,
    FATUR_SSG: row.fatur_ssg ?? null,
    DT_FATUR_SSG: row.dt_fatur_ssg ?? null,
    REP: row.rep ?? '',
    COORD: row.coord ?? '',
    OS_NEOGEN: row.os_neogen ?? null,
    PROD_NEOGEN: row.prod_neogen ?? null,
    N_AMOSTRAS_NEOGEN: row.n_amostras_neogen ?? null,
    DT_CRA: row.dt_cra ?? null,
    PLAN_NEOGEN: row.plan_neogen ?? null,
    DT_PLAN_NEOGEN: row.dt_plan_neogen ?? null,
    N_VRI: row.n_vri ?? null,
    DT_VRI: row.dt_vri ?? null,
    N_LPR: row.n_lpr ?? null,
    DT_LPR: row.dt_lpr ?? null,
    N_LR: row.n_lr ?? null,
    DT_LR: row.dt_lr ?? null,
    LR_RASTREIO: row.lr_rastreio ?? null,
    NF_NEOGEM: row.nf_neogem ?? null,
    NF_NA_NEOGEN: row.nf_na_neogen ?? null,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    prioridade: 'media',
    flag_reagendamento: false,
    issue_text: null,
    source_table: 'orders',
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

async function fetchServiceOrders(): Promise<PowerRow[]> {
  // RLS policies will automatically filter based on user role
  // No need for manual filtering - Supabase handles it
  const { data, error } = await supabase
    .from('service_orders')
    .select('*, clients!service_orders_client_id_fkey ( nome, coordenador, representante, deleted_at )')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching service orders:', error);
    return [];
  }

  const rows = (data ?? []) as ServiceOrderWithClient[];
  return rows.map((row) => mapServiceOrderRow(row));
}

async function fetchLegacyOrders(serviceOrderCodes: Set<string>): Promise<PowerRow[]> {
  // RLS policies will automatically filter based on user role
  // No need for manual filtering - Supabase handles it
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching legacy orders:', error);
    return [];
  }

  return (data ?? [])
    .filter((row) => {
      if (!row.os_ssgen) return true;
      return !serviceOrderCodes.has(String(row.os_ssgen));
    })
    .map((row) => mapLegacyOrderRow(row));
}

function sortByCreatedAtDesc(rows: PowerRow[]): PowerRow[] {
  return [...rows].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export async function fetchOrders(): Promise<PowerRow[]> {
  const serviceOrders = await fetchServiceOrders();
  const serviceOrderCodes = new Set(
    serviceOrders
      .map((row) => row.OS_SSGEN)
      .filter((code): code is string => Boolean(code)),
  );

  const legacyOrders = await fetchLegacyOrders(serviceOrderCodes);

  return sortByCreatedAtDesc([...serviceOrders, ...legacyOrders]);
}

export async function fetchUnifiedOrdersForDashboard(): Promise<PowerRow[]> {
  return fetchOrders();
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
