import { useQuery } from '@tanstack/react-query';
import { fetchTrackerKPIs } from '@/lib/trackerApi';
import type { TrackerKPI } from '@/types/ssgen';

export function useTrackerKpis(accountId?: number | null) {
  return useQuery<TrackerKPI>({
    queryKey: ['tracker_kpis', accountId ?? 'all'],
    queryFn: () => fetchTrackerKPIs({ accountId }),
    refetchInterval: 30000,
  });
}
