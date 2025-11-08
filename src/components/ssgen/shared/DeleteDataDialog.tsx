import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { requireAdmin } from '@/lib/ssgenClient';

interface DeleteDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteDataDialog: React.FC<DeleteDataDialogProps> = ({ open, onOpenChange }) => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClients = async () => {
    setDeleting(true);
    try {
      await requireAdmin();
      const { error } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .neq('ordem_servico_ssgen', 0);
      
      if (error) throw error;
      
      toast({
        title: 'Clientes apagados',
        description: 'Todos os clientes foram removidos com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao apagar clientes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOrders = async () => {
    setDeleting(true);
    try {
      await requireAdmin();
      const { error } = await supabase
        .from('service_orders')
        .update({ deleted_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      toast({
        title: 'Ordens apagadas',
        description: 'Todas as ordens de serviço foram removidas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao apagar ordens',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      // Primeiro apaga ordens, depois clientes (por causa das foreign keys)
      await requireAdmin();
      const { error: ordersError } = await supabase
        .from('service_orders')
        .update({ deleted_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (ordersError) throw ordersError;

      const { error: clientsError } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .neq('ordem_servico_ssgen', 0);
      if (clientsError) throw clientsError;
      
      toast({
        title: 'Todos os dados apagados',
        description: 'Clientes e ordens foram removidos com sucesso.',
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao apagar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Gerenciar Dados do Sistema
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-semibold text-foreground">
              Atenção: Esta ação é irreversível!
            </p>
            <p>
              Escolha qual tipo de dados deseja apagar do sistema. Todos os registros serão permanentemente removidos.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={handleDeleteClients}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Apagar Todos os Clientes
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={handleDeleteOrders}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Apagar Todas as Ordens de Serviço
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={handleDeleteAll}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Apagar Todos os Dados (Clientes + Ordens)
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
