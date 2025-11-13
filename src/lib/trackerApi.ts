import { supabase } from '@/integrations/supabase/client';
import type { TeamLocation, MapOrder, TrackerTimeline, TrackerKPI } from '@/types/ssgen';
import { requireAdmin } from '@/lib/ssgenClient';

export type UserScope = {
  userId: string;
  role: 'ADM' | 'GERENTE' | 'REPRESENTANTE';
};

const sanitizeNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
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

const calculateAgingDays = (createdAt?: string, completedAt?: string | null): number => {
  if (!createdAt) return 0;
  const start = new Date(createdAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const mapServiceOrderToTimeline = (order: any, clientName?: string): TrackerTimeline => {
  const aging = calculateAgingDays(order.created_at, order.dt_faturamento);
  
  return {
    id: order.id,
    ordem_servico_ssgen: order.ordem_servico_ssgen || 0,
    cliente: clientName || 'N/A',
    prioridade: order.prioridade,
    flag_reagendamento: order.flag_reagendamento,
    issue_text: order.issue_text,
    source_table: 'service_orders',
    numero_amostras: order.numero_amostras,
    etapa1_cra_data: order.cra_data,
    etapa2_envio_planilha_data: order.envio_planilha_data,
    etapa3_vri_data: order.vri_data,
    etapa4_vri_resolucao_data: order.vri_resolvido_data,
    etapa5_lpr_data: order.lpr_data,
    etapa6_receb_resultados_data: order.dt_receb_resultados,
    etapa7_envio_resultados_data: order.envio_resultados_data,
    etapa8_faturamento_data: order.dt_faturamento,
    aging_dias_total: aging,
    etapa_atual: order.etapa_atual || 'Recebida',
    etapa2_status_sla: order.envio_planilha_status_sla,
    etapa3_status_sla: order.vri_status_sla,
    etapa5_status_sla: order.lpr_status_sla,
    etapa7_status_sla: order.envio_resultados_status_sla,
  };
};

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
  ctx?: UserScope,
): Promise<TrackerTimeline | null> {
  const { data: order, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      clients!service_orders_client_id_fkey (
        nome
      )
    `)
    .eq('id', orderId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error fetching order timeline:', error);
    return null;
  }

  if (!order) return null;

  const clientName = (order.clients as any)?.nome || 'N/A';
  return mapServiceOrderToTimeline(order, clientName);
}

export async function fetchAllTimelines(
  accountId?: string,
  ctx?: UserScope,
): Promise<TrackerTimeline[]> {
  let query = supabase
    .from('service_orders')
    .select(`
      *,
      clients!service_orders_client_id_fkey (
        nome
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (accountId && accountId.length > 0) {
    const parsed = Number(accountId);
    if (!Number.isNaN(parsed)) {
      query = query.eq('ordem_servico_ssgen', parsed);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching timelines:', error);
    throw error;
  }

  return (data || []).map((order) => {
    const clientName = (order.clients as any)?.nome || 'N/A';
    return mapServiceOrderToTimeline(order, clientName);
  });
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
