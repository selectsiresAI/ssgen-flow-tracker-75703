import { useQuery } from '@tanstack/react-query';
import { fetchTrackerKPIs } from '@/lib/trackerApi';
import type { TrackerKPI } from '@/types/ssgen';

export function useTrackerKpis() {
  return useQuery<TrackerKPI>({
    queryKey: ['tracker_kpis'],
    queryFn: fetchTrackerKPIs,
    refetchInterval: 30000,
  });
}
