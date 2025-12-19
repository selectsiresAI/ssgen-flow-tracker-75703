import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UnifiedOrder } from '@/types/ssgen';
import { fmt } from '@/types/ssgen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditableCell } from './EditableCell';
import { SLABadge } from './SLABadge';
import { deleteServiceOrder, updateServiceOrder } from '@/lib/serviceOrdersApi';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface UnifiedOrdersTableProps {
  rows: UnifiedOrder[];
  onOpen: (r: UnifiedOrder) => void;
  userRole?: string;
  onUpdate?: () => void;
}

export const UnifiedOrdersTable: React.FC<UnifiedOrdersTableProps> = ({ 
  rows, 
  onOpen, 
  userRole,
  onUpdate 
}) => {
  const isAdmin = userRole === 'ADM';

  const handleCellUpdate = async (orderId: string | undefined, field: string, value: any) => {
    if (!orderId) {
      toast.error('ID da ordem não encontrado');
      return;
    }

    try {
      await updateServiceOrder(orderId, { [field]: value });
      toast.success('Campo atualizado com sucesso');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Erro ao atualizar campo');
      throw error;
    }
  };

  const handleDeleteOrder = async (orderId: string | undefined) => {
    if (!orderId) {
      toast.error('ID da ordem não encontrado');
      return;
    }

    try {
      await deleteServiceOrder(orderId);
      toast.success('Ordem apagada com sucesso');
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao apagar ordem');
      throw error;
    }
  };

  // Classes para colunas fixas (sticky)
  const stickyColBase = "p-2 border bg-background";
  const stickyColHeaderBase = "p-2 text-left border bg-muted";

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[2600px] relative">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Colunas fixas */}
              <th className={`${stickyColHeaderBase} sticky left-0 z-30 min-w-[100px]`}>OS SSGen</th>
              <th className={`${stickyColHeaderBase} sticky left-[100px] z-30 min-w-[180px]`}>Nome</th>
              {/* Colunas normais */}
              <th className="p-2 text-left border bg-muted">Order ID</th>
              <th className="p-2 text-left border bg-muted">Data</th>
              <th className="p-2 text-left border bg-muted">OS Neogen</th>
              <th className="p-2 text-left border bg-muted">CPF/CNPJ</th>
              <th className="p-2 text-left border bg-muted">IE/RG</th>
              <th className="p-2 text-left border bg-muted">Código</th>
              <th className="p-2 text-left border bg-muted">Status</th>
              <th className="p-2 text-left border bg-muted">Representante</th>
              <th className="p-2 text-left border bg-muted">Coordenador</th>
              <th className="p-2 text-left border bg-muted">ID Conta</th>
              <th className="p-2 text-left border bg-muted">NF Neogen</th>
              <th className="p-2 text-left border bg-muted">Produto</th>
              <th className="p-2 text-left border bg-muted">N° Amostras</th>
              <th className="p-2 text-left border bg-muted">CRA Data</th>
              <th className="p-2 text-left border bg-muted">CRA Status</th>
              <th className="p-2 text-left border bg-muted">Envio Plan. Data</th>
              <th className="p-2 text-left border bg-muted">Envio Plan. Status</th>
              <th className="p-2 text-left border bg-muted">Envio Plan. SLA</th>
              <th className="p-2 text-left border bg-muted">VRI Data</th>
              <th className="p-2 text-left border bg-muted">VRI N° Amostras</th>
              <th className="p-2 text-left border bg-muted">VRI Resolvido</th>
              <th className="p-2 text-left border bg-muted">VRI SLA</th>
              <th className="p-2 text-left border bg-muted">LPR Data</th>
              <th className="p-2 text-left border bg-muted">LPR N° Amostras</th>
              <th className="p-2 text-left border bg-muted">LPR SLA</th>
              <th className="p-2 text-left border bg-muted">Env. Result. Data</th>
              <th className="p-2 text-left border bg-muted">Env. Result. Status</th>
              <th className="p-2 text-left border bg-muted">Env. Result. SLA</th>
              <th className="p-2 text-left border bg-muted">Receb. Result. Data</th>
              <th className="p-2 text-left border bg-muted">Faturamento Data</th>
              <th className="p-2 text-left border bg-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={33} className="p-4 text-center text-muted-foreground">
                  Nenhuma ordem encontrada
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  {/* Colunas fixas */}
                  <td className={`${stickyColBase} sticky left-0 z-10 min-w-[100px]`}>
                    <button
                      onClick={() => onOpen(row)}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.ordem_servico_ssgen}
                    </button>
                  </td>
                  <td className={`${stickyColBase} sticky left-[100px] z-10 min-w-[180px]`}>
                    {row.cliente_nome || '—'}
                  </td>
                  {/* Colunas normais */}
                  <td className="p-2 border">
                    <span className="text-xs text-muted-foreground font-mono">
                      {row.ordem_id ? row.ordem_id.slice(0, 8) + '...' : '—'}
                    </span>
                  </td>
                  <td className="p-2 border">{fmt(row.updated_at)}</td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.ordem_servico_neogen}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'ordem_servico_neogen', v)}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">{row.cpf_cnpj || '—'}</td>
                  <td className="p-2 border">{row.ie_rg || '—'}</td>
                  <td className="p-2 border">{row.codigo || '—'}</td>
                  <td className="p-2 border">
                    {row.cliente_status ? (
                      <Badge variant="outline">{row.cliente_status}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 border">{row.representante || '—'}</td>
                  <td className="p-2 border">{row.coordenador || '—'}</td>
                  <td className="p-2 border">{row.id_conta_ssgen || '—'}</td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.numero_nf_neogen}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'numero_nf_neogen', v)}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.nome_produto}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'nome_produto', v)}
                      isEditable={isAdmin}
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.numero_amostras}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'numero_amostras', v)}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.cra_data}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'cra_data', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.cra_status}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'cra_status', v)}
                      isEditable={isAdmin}
                      type="badge"
                      badgeVariant="secondary"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_planilha_data}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'envio_planilha_data', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_planilha_status}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'envio_planilha_status', v)}
                      isEditable={isAdmin}
                      type="badge"
                      badgeVariant="secondary"
                    />
                  </td>
                  <td className="p-2 border">
                    <SLABadge status={row.envio_planilha_status_sla} />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_data}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'vri_data', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_n_amostras}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'vri_n_amostras', v)}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_resolvido_data}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'vri_resolvido_data', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <SLABadge status={row.vri_status_sla} />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.lpr_data}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'lpr_data', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.lpr_n_amostras}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'lpr_n_amostras', v)}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <SLABadge status={row.lpr_status_sla} />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_resultados_data}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'envio_resultados_data', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_resultados_status}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'envio_resultados_status', v)}
                      isEditable={isAdmin}
                      type="badge"
                      badgeVariant="secondary"
                    />
                  </td>
                  <td className="p-2 border">
                    <SLABadge status={row.envio_resultados_status_sla} />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.dt_receb_resultados}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'dt_receb_resultados', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.dt_faturamento}
                      onSave={(v) => handleCellUpdate(row.ordem_id, 'dt_faturamento', v)}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpen(row)}
                      >
                        Detalhes
                      </Button>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-1">
                              <Trash2 className="h-4 w-4" />
                              Apagar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apagar ordem</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Tem certeza que deseja remover a ordem
                                {` ${row.ordem_servico_ssgen ?? ''}`} do sistema?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(row.ordem_id)}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
};
