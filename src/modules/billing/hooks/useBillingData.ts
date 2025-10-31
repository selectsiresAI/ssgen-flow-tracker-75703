import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchBillingSummary, 
  fetchReadyToInvoice, 
  fetchBillingMonthly,
  fetchBillingByRep,
  fetchBillingByCoord,
  invoiceOrder
} from '@/lib/billingApi';

export function useBillingSummary() {
  return useQuery({
    queryKey: ['billing_summary'],
    queryFn: fetchBillingSummary,
    refetchInterval: 60000,
  });
}

export function useReadyToInvoice() {
  return useQuery({
    queryKey: ['ready_to_invoice'],
    queryFn: fetchReadyToInvoice,
    refetchInterval: 30000,
  });
}

export function useBillingMonthly() {
  return useQuery({
    queryKey: ['billing_monthly'],
    queryFn: fetchBillingMonthly,
    refetchInterval: 60000,
  });
}

export function useBillingByRep() {
  return useQuery({
    queryKey: ['billing_by_rep'],
    queryFn: fetchBillingByRep,
    refetchInterval: 60000,
  });
}

export function useBillingByCoord() {
  return useQuery({
    queryKey: ['billing_by_coord'],
    queryFn: fetchBillingByCoord,
    refetchInterval: 60000,
  });
}

export function useInvoiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dt_faturamento }: { orderId: string; dt_faturamento: string }) =>
      invoiceOrder(orderId, dt_faturamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing_summary'] });
      queryClient.invalidateQueries({ queryKey: ['ready_to_invoice'] });
      queryClient.invalidateQueries({ queryKey: ['billing_monthly'] });
    },
  });
}
