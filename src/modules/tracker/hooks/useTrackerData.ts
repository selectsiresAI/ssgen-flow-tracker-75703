import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllTimelines,
  fetchTrackerKPIs,
  fetchMapOrders,
  fetchTeamLocations,
  updateOrderPriority,
  toggleReagendamento,
  updateIssueText,
  deleteServiceOrder
} from '@/lib/trackerApi';
import type { TrackerKPI } from '@/types/ssgen';
import { useAuthProfile } from '@/hooks/useAuthProfile';

const buildScopeHash = (values: string[] = []) => values.slice().sort().join('|');

export function useTrackerTimelines(accountId?: string) {
  const { data: profile } = useAuthProfile();

  const scopeHash = useMemo(() => {
    if (!profile) return 'no-scope';
    return `${buildScopeHash(profile.managerOfRepIds)}::${buildScopeHash(profile.repOfClientIds)}`;
  }, [profile]);

  return useQuery({
    enabled: Boolean(profile),
    queryKey: ['tracker_timelines', accountId ?? null, profile?.userId ?? null, profile?.role, scopeHash],
    queryFn: () =>
      fetchAllTimelines(accountId, {
        userId: profile!.userId,
        role: profile!.role,
      }),
    refetchInterval: 30000,
  });
}

export function useTrackerKPIs(accountId?: string) {
  const { data: profile } = useAuthProfile();

  const scopeHash = useMemo(() => {
    if (!profile) return 'no-scope';
    return `${buildScopeHash(profile.managerOfRepIds)}::${buildScopeHash(profile.repOfClientIds)}`;
  }, [profile]);

  return useQuery<TrackerKPI>({
    enabled: Boolean(profile),
    queryKey: ['tracker_kpis', accountId ?? null, profile?.userId ?? null, profile?.role, scopeHash],
    queryFn: () =>
      fetchTrackerKPIs(accountId, {
        userId: profile!.userId,
        role: profile!.role,
      }),
    refetchInterval: 30000,
  });
}

export function useTrackerMapOrders() {
  const { data: profile } = useAuthProfile();
  const scopeKey = useMemo(() => profile?.role ?? 'unknown', [profile]);

  return useQuery({
    queryKey: ['tracker_map_orders', scopeKey],
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
