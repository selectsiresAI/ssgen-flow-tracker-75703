import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TeamLocation, MapOrder, TrackerTimeline, TrackerKPI } from '@/types/ssgen';
import { requireAdmin } from '@/lib/ssgenClient';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type ServiceOrderRow = Database['public']['Tables']['service_orders']['Row'];
type LegacyOrderRow = Database['public']['Tables']['orders']['Row'];
type ClientRow = Pick<Database['public']['Tables']['clients']['Row'], 'nome' | 'deleted_at' | 'id_conta_ssgen'>;
type ServiceOrderWithClient = ServiceOrderRow & {
  clients?: ClientRow | ClientRow[] | null;
};

type TrackerSources = {
  serviceOrders: ServiceOrderWithClient[];
  legacyOrders: LegacyOrderRow[];
};

type TrackerQueryOptions = {
  accountId?: number | null;
};

const normalizeAccountId = (value?: number | null): number | null => {
  if (value == null) return null;
  if (typeof value !== 'number') return null;
  return Number.isFinite(value) ? value : null;
};

const toStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const computeAgingDays = (startDate?: string | null): number | null => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;

  const today = toStartOfDay(new Date());
  const startDay = toStartOfDay(start);
  const diff = today.getTime() - startDay.getTime();
  return Math.floor(diff / MS_PER_DAY);
};

const getClientName = (row: ServiceOrderWithClient): string => {
  const relation = row.clients;
  if (!relation) return '';

  if (Array.isArray(relation)) {
    const active = relation.find((client) => !client?.deleted_at);
    return (active ?? relation[0] ?? { nome: '' }).nome ?? '';
  }

  if (relation.deleted_at) {
    return '';
  }

  return relation.nome ?? '';
};

const getClientAccountId = (row: ServiceOrderWithClient): number | null => {
  const relation = row.clients;
  if (!relation) return null;

  if (Array.isArray(relation)) {
    const active = relation.find((client) => !client?.deleted_at);
    const target = active ?? relation[0];
    return target?.id_conta_ssgen ?? null;
  }

  if (relation.deleted_at) {
    return null;
  }

  return relation.id_conta_ssgen ?? null;
};

const computeServiceOrderStage = (row: ServiceOrderRow): string | null => {
  if (row.dt_faturamento) return 'Faturamento';
  if (row.envio_resultados_data) return 'Envio Resultados';
  if (row.dt_receb_resultados) return 'Recebimento Resultados';
  if (row.lpr_data) return 'LPR';
  if (row.vri_resolvido_data) return 'VRI Resolvido';
  if (row.vri_data) return 'VRI';
  if (row.envio_planilha_data) return 'Envio Planilha';
  if (row.cra_data) return 'CRA';
  return 'Pendente';
};

const mapServiceOrderToTimeline = (row: ServiceOrderWithClient): TrackerTimeline => ({
  id: row.id,
  ordem_servico_ssgen: row.ordem_servico_ssgen,
  cliente: getClientName(row) || '—',
  id_conta_ssgen: getClientAccountId(row) ?? undefined,
  prioridade: row.prioridade,
  flag_reagendamento: row.flag_reagendamento ?? undefined,
  issue_text: row.issue_text ?? undefined,
  source_table: 'service_orders',
  etapa1_cra_data: row.cra_data,
  etapa2_envio_planilha_data: row.envio_planilha_data,
  etapa3_vri_data: row.vri_data,
  etapa4_vri_resolucao_data: row.vri_resolvido_data,
  etapa5_lpr_data: row.lpr_data,
  etapa6_receb_resultados_data: row.dt_receb_resultados,
  etapa7_envio_resultados_data: row.envio_resultados_data,
  etapa8_faturamento_data: row.dt_faturamento,
  aging_dias_total: computeAgingDays(row.cra_data),
  etapa_atual: computeServiceOrderStage(row),
  etapa2_status_sla: row.envio_planilha_status_sla,
  etapa3_status_sla: row.vri_status_sla,
  etapa5_status_sla: row.lpr_status_sla,
  etapa7_status_sla: row.envio_resultados_status_sla,
});

const parseOrderNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const computeLegacyStage = (row: LegacyOrderRow): string | null => {
  if (row.dt_fatur_ssg) return 'Faturamento';
  if (row.dt_result_ssg) return 'Envio Resultados';
  if (row.dt_lr) return 'Recebimento Resultados';
  if (row.dt_lpr) return 'LPR';
  if (row.dt_vri) return 'VRI';
  if (row.dt_plan_neogen) return 'Envio Planilha';
  if (row.dt_cra) return 'CRA';
  return 'Pendente';
};

const mapLegacyOrderToTimeline = (row: LegacyOrderRow): TrackerTimeline => ({
  id: row.id ?? `${row.os_ssgen ?? ''}`,
  ordem_servico_ssgen: parseOrderNumber(row.os_ssgen),
  cliente: row.cliente ?? '—',
  prioridade: 'media',
  flag_reagendamento: false,
  issue_text: null,
  source_table: 'orders',
  etapa1_cra_data: row.dt_cra,
  etapa2_envio_planilha_data: row.dt_plan_neogen,
  etapa3_vri_data: row.dt_vri,
  etapa4_vri_resolucao_data: null,
  etapa5_lpr_data: row.dt_lpr,
  etapa6_receb_resultados_data: row.dt_lr,
  etapa7_envio_resultados_data: row.dt_result_ssg,
  etapa8_faturamento_data: row.dt_fatur_ssg,
  aging_dias_total: computeAgingDays(row.dt_cra),
  etapa_atual: computeLegacyStage(row),
  etapa2_status_sla: null,
  etapa3_status_sla: null,
  etapa5_status_sla: null,
  etapa7_status_sla: null,
});

async function fetchServiceOrdersRaw(accountId?: number | null): Promise<ServiceOrderWithClient[]> {
  let query = supabase
    .from('service_orders')
    .select(`
      *,
      clients:clients!service_orders_client_id_fkey ( nome, deleted_at, id_conta_ssgen )
    `)
    .is('deleted_at', null)
    .order('cra_data', { ascending: false });

  if (accountId != null) {
    query = query.eq('clients.id_conta_ssgen', accountId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching service orders for tracker:', error);
    return [];
  }

  return (data ?? []) as ServiceOrderWithClient[];
}

async function fetchLegacyOrdersRaw(allowedCodes?: Set<string> | null): Promise<LegacyOrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching legacy orders for tracker:', error);
    return [];
  }

  const rows = (data ?? []) as LegacyOrderRow[];

  if (!allowedCodes) {
    return rows;
  }

  if (allowedCodes.size === 0) {
    return [];
  }

  return rows.filter((row) => {
    if (!row.os_ssgen) return false;
    return allowedCodes.has(String(row.os_ssgen));
  });
}

type ClientCodeRow = Pick<Database['public']['Tables']['clients']['Row'], 'ordem_servico_ssgen'>;

async function fetchAccountClientCodes(accountId: number): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('clients')
    .select('ordem_servico_ssgen')
    .eq('id_conta_ssgen', accountId)
    .not('ordem_servico_ssgen', 'is', null);

  if (error) {
    console.error('Error fetching client codes for account:', error);
    return new Set();
  }

  const codes = new Set<string>();
  (data as ClientCodeRow[] | null)?.forEach((row) => {
    const code = row?.ordem_servico_ssgen;
    if (typeof code === 'number' && Number.isFinite(code)) {
      codes.add(String(code));
    }
  });

  return codes;
}

async function loadTrackerSources(accountId?: number | null): Promise<TrackerSources> {
  const normalizedAccountId = normalizeAccountId(accountId);

  const accountCodesPromise = normalizedAccountId != null
    ? fetchAccountClientCodes(normalizedAccountId)
    : Promise.resolve<Set<string> | null>(null);

  const [serviceOrders, accountCodes, legacyOrdersRaw] = await Promise.all([
    fetchServiceOrdersRaw(normalizedAccountId),
    accountCodesPromise,
    fetchLegacyOrdersRaw(accountCodes ?? null),
  ]);

  const serviceOrderCodes = new Set(
    serviceOrders
      .map((row) => row.ordem_servico_ssgen)
      .filter((code): code is number => typeof code === 'number')
      .map((code) => String(code))
  );

  const allowedLegacyCodes = accountCodes;

  const legacyOrders = legacyOrdersRaw.filter((row) => {
    const os = row.os_ssgen;
    if (!os) {
      return !allowedLegacyCodes;
    }

    const code = String(os);
    if (serviceOrderCodes.has(code)) {
      return false;
    }

    if (allowedLegacyCodes && !allowedLegacyCodes.has(code)) {
      return false;
    }

    return true;
  });

  return { serviceOrders, legacyOrders };
}

async function fetchServiceOrderTimeline(orderId: string): Promise<TrackerTimeline | null> {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      clients:clients!service_orders_client_id_fkey ( nome, deleted_at )
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching service order timeline:', error);
    }
    return null;
  }

  if (!data) return null;
  return mapServiceOrderToTimeline(data as ServiceOrderWithClient);
}

async function fetchLegacyOrderTimeline(orderId: string): Promise<TrackerTimeline | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching legacy order timeline:', error);
    }
    return null;
  }

  if (!data) return null;
  return mapLegacyOrderToTimeline(data as LegacyOrderRow);
}

const countWhere = <T,>(rows: T[], predicate: (row: T) => boolean) =>
  rows.reduce((acc, row) => (predicate(row) ? acc + 1 : acc), 0);

const sumNumbers = (values: Array<number | string | null | undefined>): number =>
  values.reduce<number>((acc, value) => {
    if (value == null) return acc;
    const numeric = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(numeric) ? acc + numeric : acc;
  }, 0);

const roundOneDecimal = (value: number) => Math.round(value * 10) / 10;

export async function fetchMapOrders(): Promise<MapOrder[]> {
  const { data, error } = await supabase
    .from('v_map_orders' as any)
    .select('*');

  if (error) {
    console.error('Error fetching map orders:', error);
    return [];
  }
  return (data || []) as unknown as MapOrder[];
}

export async function fetchOrderTimeline(orderId: string): Promise<TrackerTimeline | null> {
  const serviceOrder = await fetchServiceOrderTimeline(orderId);
  if (serviceOrder) return serviceOrder;
  return fetchLegacyOrderTimeline(orderId);
}

export async function fetchAllTimelines(options: TrackerQueryOptions = {}): Promise<TrackerTimeline[]> {
  const { accountId } = options;
  const { serviceOrders, legacyOrders } = await loadTrackerSources(accountId);
  const timelines = [
    ...serviceOrders.map(mapServiceOrderToTimeline),
    ...legacyOrders.map(mapLegacyOrderToTimeline),
  ];

  return timelines.sort(
    (a, b) => (b.aging_dias_total ?? Number.MIN_SAFE_INTEGER) - (a.aging_dias_total ?? Number.MIN_SAFE_INTEGER),
  );
}

export async function fetchTrackerKPIs(options: TrackerQueryOptions = {}): Promise<TrackerKPI> {
  const { accountId } = options;
  const { serviceOrders, legacyOrders } = await loadTrackerSources(accountId);
  const totalOrders = serviceOrders.length + legacyOrders.length;

  const totalClientesSet = new Set<string>();
  serviceOrders.forEach((row) => {
    const name = getClientName(row);
    if (name) totalClientesSet.add(name);
  });
  legacyOrders.forEach((row) => {
    if (row.cliente) totalClientesSet.add(row.cliente);
  });

  const totalAmostras =
    sumNumbers(serviceOrders.map((row) => row.numero_amostras ?? null)) +
    sumNumbers(legacyOrders.map((row) => row.n_amostras_ssg ?? null));

  const emProcessamento =
    countWhere(serviceOrders, (row) => !row.dt_faturamento) +
    countWhere(legacyOrders, (row) => !row.dt_fatur_ssg);

  const aFaturar =
    countWhere(serviceOrders, (row) => Boolean(row.envio_resultados_data) && !row.dt_faturamento) +
    countWhere(legacyOrders, (row) => Boolean(row.dt_result_ssg) && !row.dt_fatur_ssg);

  const todayIso = new Date().toISOString().slice(0, 10);
  const concluidasHoje =
    countWhere(serviceOrders, (row) => row.dt_faturamento?.slice(0, 10) === todayIso) +
    countWhere(legacyOrders, (row) => row.dt_fatur_ssg?.slice(0, 10) === todayIso);

  const reagendamentos = countWhere(serviceOrders, (row) => row.flag_reagendamento === true);
  const altaPrioridade = countWhere(serviceOrders, (row) => row.prioridade === 'alta');

  const slaEnvioOk = countWhere(serviceOrders, (row) => row.envio_planilha_status_sla === 'no_prazo');
  const slaEnvioAtrasado = countWhere(serviceOrders, (row) => row.envio_planilha_status_sla === 'atrasado');
  const slaVriOk = countWhere(serviceOrders, (row) => row.vri_status_sla === 'no_prazo');
  const slaVriAtrasado = countWhere(serviceOrders, (row) => row.vri_status_sla === 'atrasado');
  const slaLprOk = countWhere(serviceOrders, (row) => row.lpr_status_sla === 'no_prazo');
  const slaLprAtrasado = countWhere(serviceOrders, (row) => row.lpr_status_sla === 'atrasado');
  const slaEnvioResOk = countWhere(serviceOrders, (row) => row.envio_resultados_status_sla === 'no_prazo');
  const slaEnvioResAtrasado = countWhere(serviceOrders, (row) => row.envio_resultados_status_sla === 'atrasado');

  const concludedAging: number[] = [];
  serviceOrders.forEach((row) => {
    if (row.dt_faturamento) {
      const aging = computeAgingDays(row.cra_data);
      if (aging !== null) concludedAging.push(aging);
    }
  });
  legacyOrders.forEach((row) => {
    if (row.dt_fatur_ssg) {
      const aging = computeAgingDays(row.dt_cra);
      if (aging !== null) concludedAging.push(aging);
    }
  });

  const tmaDias = concludedAging.length
    ? roundOneDecimal(concludedAging.reduce((acc, value) => acc + value, 0) / concludedAging.length)
    : 0;

  const pct = (value: number) => (totalOrders > 0 ? roundOneDecimal((value / totalOrders) * 100) : 0);

  return {
    total_os: totalOrders,
    total_ordens: totalOrders,
    total_amostras: totalAmostras,
    total_clientes: totalClientesSet.size,
    em_processamento: emProcessamento,
    a_faturar: aFaturar,
    concluidas_hoje: concluidasHoje,
    reagendamentos,
    alta_prioridade: altaPrioridade,
    tma_dias: tmaDias,
    sla_envio_ok: slaEnvioOk,
    sla_envio_atrasado: slaEnvioAtrasado,
    pct_sla_envio_ok: pct(slaEnvioOk),
    sla_vri_ok: slaVriOk,
    sla_vri_atrasado: slaVriAtrasado,
    pct_sla_vri_ok: pct(slaVriOk),
    sla_lpr_ok: slaLprOk,
    sla_lpr_atrasado: slaLprAtrasado,
    pct_sla_lpr_ok: pct(slaLprOk),
    sla_envio_res_ok: slaEnvioResOk,
    sla_envio_res_atrasado: slaEnvioResAtrasado,
    pct_sla_envio_res_ok: pct(slaEnvioResOk),
  };
}

export async function fetchTeamLocations(): Promise<TeamLocation[]> {
  const { data, error } = await supabase
    .from('team_locations' as any)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching team locations:', error);
    return [];
  }
  return (data || []) as unknown as TeamLocation[];
}

export async function upsertTeamLocation(
  userId: string,
  nome: string,
  lat: number,
  lon: number,
  status: 'online' | 'ocupado' | 'offline' = 'online'
): Promise<TeamLocation | null> {
  const { data, error } = await supabase
    .from('team_locations' as any)
    .upsert({
      user_id: userId,
      nome,
      lat,
      lon,
      status,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting team location:', error);
    return null;
  }
  return data as unknown as TeamLocation;
}

export async function updateOrderPriority(
  orderId: string,
  prioridade: 'alta' | 'media' | 'baixa'
) {
  await requireAdmin();
  const { error } = await supabase
    .from('service_orders')
    .update({ prioridade } as any)
    .eq('id', orderId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function toggleReagendamento(orderId: string, flag: boolean) {
  await requireAdmin();
  const { error } = await supabase
    .from('service_orders')
    .update({ flag_reagendamento: flag } as any)
    .eq('id', orderId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function updateIssueText(orderId: string, issueText: string) {
  await requireAdmin();
  const { error } = await supabase
    .from('service_orders')
    .update({ issue_text: issueText } as any)
    .eq('id', orderId)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function deleteServiceOrder(
  orderId: string,
  source: 'service_orders' | 'orders' = 'service_orders',
) {
  await requireAdmin();

  const table = source === 'orders' ? 'orders' : 'service_orders';

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq('id', orderId)
    .is('deleted_at', null);

  if (error) throw error;
}
