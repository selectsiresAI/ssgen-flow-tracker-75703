import { useTrackerKPIs as useTrackerKPIsWithScope } from './useTrackerData';

export function useTrackerKpis(accountId?: string) {
  return useTrackerKPIsWithScope(accountId);
}
