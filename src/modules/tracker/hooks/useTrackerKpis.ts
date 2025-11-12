import type { TrackerQueryOptions } from '@/lib/trackerApi';
import { useTrackerKPIs } from './useTrackerData';

type TrackerQueryConfig = {
  enabled?: boolean;
};

export function useTrackerKpis(
  options: TrackerQueryOptions = {},
  config: TrackerQueryConfig = {}
) {
  return useTrackerKPIs(options, config);
}
