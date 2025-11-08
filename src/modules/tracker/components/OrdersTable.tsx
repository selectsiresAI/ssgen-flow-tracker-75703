import { useEffect, useState } from 'react';
import type { TrackerTimeline } from '@/types/ssgen';
import { useDeleteOrder } from '../hooks/useTrackerData';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OrderTimer } from './OrderTimer';
import { getProfile } from '@/lib/ssgenClient';

type DeleteTarget = {
  id: string;
  source?: 'service_orders' | 'orders';
};

export function OrdersTable({ rows }: { rows: TrackerTimeline[] }) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const deleteMutation = useDeleteOrder();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getProfile();
      setIsAdmin(profile?.role === 'ADM');
    };
    loadProfile();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (!isAdmin) {
      toast.error('Apenas administradores podem remover ordens.');
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        orderId: deleteTarget.id,
        sourceTable: deleteTarget.source ?? 'service_orders',
      });
      toast.success('Ordem removida com sucesso');
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Erro ao remover ordem');
    }
  };

  const handleOpenDelete = (id: string, sourceTable?: string | null) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem remover ordens.');
      return;
    }
    const normalizedSource: DeleteTarget['source'] = sourceTable === 'orders' ? 'orders' : 'service_orders';
    setDeleteTarget({ id, source: normalizedSource });
  };

  return (
    <>
      <div className="rounded-2xl border border-zenith-navy/30 bg-zenith-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zenith-navy/50 text-zenith-gold text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">OS</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Prioridade</th>
                <th className="px-4 py-3 text-left">Etapa Atual</th>
                <th className="px-4 py-3 text-left">Tempo</th>
                <th className="px-4 py-3 text-left">Aging (d)</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zenith-navy/20">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zenith-navy/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-white">{r.ordem_servico_ssgen}</td>
                  <td className="px-4 py-3 text-sm text-white">{r.cliente}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      r.prioridade === 'alta' 
                        ? 'bg-red-500/20 text-red-400' 
                        : r.prioridade === 'media'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {r.prioridade || 'baixa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zenith-gray">{r.etapa_atual || '—'}</td>
                  <td className="px-4 py-3">
                    <OrderTimer 
                      startDate={r.etapa1_cra_data} 
                      targetDays={30}
                      status={r.etapa2_status_sla as any}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${
                      (r.aging_dias_total ?? 0) >= 5
                        ? 'text-red-400'
                        : (r.aging_dias_total ?? 0) >= 3
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}>
                      {r.aging_dias_total ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1 text-xs rounded bg-zenith-navy text-white hover:opacity-90 transition-opacity">
                        Abrir
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(r.id, r.source_table)}
                        disabled={!isAdmin}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={!isAdmin}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
