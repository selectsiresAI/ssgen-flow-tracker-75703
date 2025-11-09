import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PowerRow } from '@/types/ssgen';

export type ManagementOrderRow = PowerRow & {
  client_id: string | null;
};

type ServiceOrderRow = Database['public']['Tables']['service_orders']['Row'];
type ClientRow = Pick<
  Database['public']['Tables']['clients']['Row'],
  'nome' | 'coordenador' | 'representante' | 'deleted_at'
>;

type ServiceOrderWithClient = ServiceOrderRow & {
  clients?: ClientRow | ClientRow[] | null;
};

type ViewOrderRow = {
  id: string;
  ordem_servico_ssgen: number | null;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  deleted_at: string | null;
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
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    prioridade: row.prioridade ?? null,
    flag_reagendamento: row.flag_reagendamento ?? null,
    issue_text: row.issue_text ?? null,
    source_table: 'service_orders',
  };
}

export async function fetchManagementOrders(): Promise<ManagementOrderRow[]> {
  const { data, error } = await supabase
    .from('v_map_orders')
    .select('id, ordem_servico_ssgen, client_id, client_name, created_at, deleted_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const baseRows = (data as ViewOrderRow[] | null) ?? [];
  const activeRows = baseRows.filter((row) => row.deleted_at == null);
  if (!activeRows.length) return [];

  const ids = activeRows.map((row) => row.id);
  const { data: details, error: err2 } = await supabase
    .from('service_orders')
    .select(
      '*, clients!service_orders_client_id_fkey ( nome, coordenador, representante, deleted_at )',
    )
    .in('id', ids);

  if (err2) throw err2;

  const detailMap = new Map<string, ServiceOrderWithClient>();
  for (const row of details ?? []) {
    if (row?.id) {
      detailMap.set(row.id, row as ServiceOrderWithClient);
    }
  }

  return activeRows
    .map((viewRow) => {
      const detail = detailMap.get(viewRow.id);
      if (!detail) return null;
      const mapped = mapServiceOrderRow(detail);
      return {
        ...mapped,
        id: viewRow.id,
        OS_SSGEN: viewRow.ordem_servico_ssgen
          ? String(viewRow.ordem_servico_ssgen)
          : mapped.OS_SSGEN,
        CLIENTE: viewRow.client_name ?? mapped.CLIENTE,
        client_id: viewRow.client_id ?? detail.client_id ?? null,
      } satisfies ManagementOrderRow;
    })
    .filter((row): row is ManagementOrderRow => row !== null);
}
