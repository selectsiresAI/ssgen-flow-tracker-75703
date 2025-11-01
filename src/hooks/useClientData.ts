import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClients, createClient, updateClient, deleteClient } from '@/lib/clientsApi';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    refetchInterval: 30000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ordem_servico_ssgen, updates }: { ordem_servico_ssgen: number; updates: any }) =>
      updateClient(ordem_servico_ssgen, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ordem_servico_ssgen: number) => deleteClient(ordem_servico_ssgen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
