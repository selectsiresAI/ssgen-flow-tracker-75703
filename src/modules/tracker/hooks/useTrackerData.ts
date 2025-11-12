import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllTimelines,
  fetchTrackerKPIs,
  fetchMapOrders,
  fetchTeamLocations,
  updateOrderPriority,
  toggleReagendamento,
  updateIssueText,
  deleteServiceOrder,
} from '@/lib/trackerApi';
import type { TrackerQueryOptions } from '@/lib/trackerApi';
import type { TrackerKPI } from '@/types/ssgen';

type TrackerQueryConfig = {
  enabled?: boolean;
};

const buildTrackerQueryKey = (options: TrackerQueryOptions) => [
  'tracker_timelines',
  options.accountId ?? 'all',
  options.role ?? 'all',
  options.coord ?? 'all',
  options.rep ?? 'all',
];

export function useTrackerTimelines(
  options: TrackerQueryOptions = {},
  config: TrackerQueryConfig = {}
) {
  const { enabled = true } = config;

  return useQuery({
    queryKey: buildTrackerQueryKey(options),
    queryFn: () => fetchAllTimelines(options),
    refetchInterval: 30000,
    enabled,
  });
}

const buildKpiQueryKey = (options: TrackerQueryOptions) => [
  'tracker_kpis',
  options.accountId ?? 'all',
  options.role ?? 'all',
  options.coord ?? 'all',
  options.rep ?? 'all',
];

export function useTrackerKPIs(
  options: TrackerQueryOptions = {},
  config: TrackerQueryConfig = {}
) {
  const { enabled = true } = config;

  return useQuery<TrackerKPI>({
    queryKey: buildKpiQueryKey(options),
    queryFn: () => fetchTrackerKPIs(options),
    refetchInterval: 30000,
    enabled,
  });
}

export function useTrackerMapOrders() {
  return useQuery({
    queryKey: ['tracker_map_orders'],
    queryFn: fetchMapOrders,
    refetchInterval: 30000,
  });
}

export function useTeamLocations() {
  return useQuery({
    queryKey: ['team_locations'],
    queryFn: fetchTeamLocations,
    refetchInterval: 10000,
  });
}

export function useUpdatePriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, prioridade }: { orderId: string; prioridade: 'alta' | 'media' | 'baixa' }) =>
      updateOrderPriority(orderId, prioridade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker_timelines'] });
      queryClient.invalidateQueries({ queryKey: ['tracker_map_orders'] });
    },
  });
}

type DeleteOrderInput = {
  orderId: string;
  sourceTable?: 'service_orders' | 'orders';
};

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, sourceTable }: DeleteOrderInput) =>
      deleteServiceOrder(orderId, sourceTable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker_timelines'] });
      queryClient.invalidateQueries({ queryKey: ['tracker_map_orders'] });
    },
  });
}
