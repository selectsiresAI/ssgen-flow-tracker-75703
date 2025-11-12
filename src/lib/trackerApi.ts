import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { TeamLocation, MapOrder, TrackerTimeline, TrackerKPI } from '@/types/ssgen';
import { requireAdmin } from '@/lib/ssgenClient';

export type UserScope = {
  userId: string;
  role: 'ADM' | 'GERENTE' | 'REPRESENTANTE';
};

type TrackerTimelineRow = Database['public']['Views']['v_tracker_timelines']['Row'];

const sanitizeNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const mapTimelineRow = (row: TrackerTimelineRow): TrackerTimeline => {
  const ordem = row.ordem_servico_ssgen;
  const fallbackId = ordem != null ? String(ordem) : '';
  return {
    id: row.source_id ?? fallbackId,
    ordem_servico_ssgen: sanitizeNumber(ordem),
    cliente: row.cliente ?? '—',
    prioridade: row.prioridade ?? undefined,
    flag_reagendamento: row.flag_reagendamento ?? undefined,
    issue_text: row.issue_text ?? undefined,
    source_table: row.source ?? undefined,
    etapa1_cra_data: row.cra_data ?? undefined,
    etapa2_envio_planilha_data: row.envio_planilha_data ?? undefined,
    etapa3_vri_data: row.vri_data ?? undefined,
    etapa4_vri_resolucao_data: row.vri_resolvido_data ?? undefined,
    etapa5_lpr_data: row.lpr_data ?? undefined,
    etapa6_receb_resultados_data: row.dt_receb_resultados ?? undefined,
    etapa7_envio_resultados_data: row.envio_resultados_data ?? undefined,
    etapa8_faturamento_data: row.dt_faturamento ?? undefined,
    aging_dias_total: row.aging_dias_total ?? undefined,
    etapa_atual: row.etapa_atual ?? undefined,
    etapa2_status_sla: row.envio_planilha_status_sla ?? undefined,
    etapa3_status_sla: row.vri_status_sla ?? undefined,
    etapa5_status_sla: row.lpr_status_sla ?? undefined,
    etapa7_status_sla: row.envio_resultados_status_sla ?? undefined,
    numero_amostras: row.numero_amostras ?? undefined,
  };
};

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

export async function fetchOrderTimeline(
  orderId: string,
  source?: 'service_orders' | 'orders',
): Promise<TrackerTimeline | null> {
  let builder = supabase
    .from('v_tracker_timelines')
    .select('*')
    .eq('source_id', orderId)
    .limit(1);

  if (source) {
    builder = builder.eq('source', source);
  }

  const { data, error } = await builder.maybeSingle<TrackerTimelineRow>();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching tracker timeline:', error);
    }
    return null;
  }

  if (!data) return null;
  return mapTimelineRow(data as TrackerTimelineRow);
}

export async function fetchAllTimelines(
  accountId?: string,
  _ctx?: UserScope,
): Promise<TrackerTimeline[]> {
  let builder = supabase
    .from('v_tracker_timelines')
    .select('*')
    .order('created_at', { ascending: false });

  if (accountId && accountId.length > 0) {
    const parsed = Number(accountId);
    if (!Number.isNaN(parsed)) {
      builder = builder.eq('id_conta_ssgen', parsed);
    }
  }

  const { data, error } = await builder;

  if (error) throw error;

  const rows = (data ?? []) as TrackerTimelineRow[];
  return rows.map(mapTimelineRow);
}

export async function fetchTrackerKPIs(
  accountId?: string,
  ctx?: UserScope,
): Promise<TrackerKPI> {
  const timelines = await fetchAllTimelines(accountId, ctx);
  const totalOrders = timelines.length;

  const totalClientesSet = new Set(
    timelines
      .map((row) => row.cliente)
      .filter((value): value is string => Boolean(value)),
  );

  const totalAmostras = sumNumbers(timelines.map((row) => row.numero_amostras ?? null));

  const emProcessamento = countWhere(timelines, (row) => !row.etapa8_faturamento_data);
  const aFaturar = countWhere(
    timelines,
    (row) => Boolean(row.etapa7_envio_resultados_data) && !row.etapa8_faturamento_data,
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const concluidasHoje = countWhere(
    timelines,
    (row) => row.etapa8_faturamento_data?.slice(0, 10) === todayIso,
  );

  const reagendamentos = countWhere(timelines, (row) => row.flag_reagendamento === true);
  const altaPrioridade = countWhere(timelines, (row) => row.prioridade === 'alta');

  const slaEnvioOk = countWhere(timelines, (row) => row.etapa2_status_sla === 'no_prazo');
  const slaEnvioAtrasado = countWhere(timelines, (row) => row.etapa2_status_sla === 'atrasado');
  const slaVriOk = countWhere(timelines, (row) => row.etapa3_status_sla === 'no_prazo');
  const slaVriAtrasado = countWhere(timelines, (row) => row.etapa3_status_sla === 'atrasado');
  const slaLprOk = countWhere(timelines, (row) => row.etapa5_status_sla === 'no_prazo');
  const slaLprAtrasado = countWhere(timelines, (row) => row.etapa5_status_sla === 'atrasado');
  const slaEnvioResOk = countWhere(timelines, (row) => row.etapa7_status_sla === 'no_prazo');
  const slaEnvioResAtrasado = countWhere(
    timelines,
    (row) => row.etapa7_status_sla === 'atrasado',
  );

  const concludedAging = timelines
    .filter((row) => row.etapa8_faturamento_data && typeof row.aging_dias_total === 'number')
    .map((row) => Number(row.aging_dias_total));

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
