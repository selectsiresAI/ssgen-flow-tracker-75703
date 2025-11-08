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

export function useTrackerTimelines() {
  return useQuery({
    queryKey: ['tracker_timelines'],
    queryFn: fetchAllTimelines,
    refetchInterval: 30000,
  });
}

export function useTrackerKPIs() {
  return useQuery({
    queryKey: ['tracker_kpis'],
    queryFn: fetchTrackerKPIs,
    refetchInterval: 30000,
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
