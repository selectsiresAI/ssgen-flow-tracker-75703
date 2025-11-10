import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UnifiedOrder } from '@/types/ssgen';
import { fmt } from '@/types/ssgen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditableCell } from './EditableCell';
import { SLABadge } from './SLABadge';
import { deleteServiceOrder, updateServiceOrder } from '@/lib/serviceOrdersApi';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  onUpdate,
}) => {
  const isAdmin = userRole === 'ADM';
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedRows = useMemo(() => {
    const parsedValue = (value: UnifiedOrder['ordem_servico_ssgen']) => {
      if (value === null || value === undefined) {
        return { numeric: Number.NaN, original: '' };
      }

      const asString = String(value).trim();
      const numeric = Number.parseInt(asString.replace(/\D/g, ''), 10);

      return {
        numeric,
        original: asString,
      };
    };

    const comparator = (a: UnifiedOrder, b: UnifiedOrder) => {
      const valueA = parsedValue(a.ordem_servico_ssgen);
      const valueB = parsedValue(b.ordem_servico_ssgen);

      if (!Number.isNaN(valueA.numeric) && !Number.isNaN(valueB.numeric)) {
        return sortDirection === 'asc'
          ? valueA.numeric - valueB.numeric
          : valueB.numeric - valueA.numeric;
      }

      if (!valueA.original && !valueB.original) {
        return 0;
      }

      if (!valueA.original) {
        return 1;
      }

      if (!valueB.original) {
        return -1;
      }

      return sortDirection === 'asc'
        ? valueA.original.localeCompare(valueB.original, 'pt-BR', {
            numeric: true,
          })
        : valueB.original.localeCompare(valueA.original, 'pt-BR', {
            numeric: true,
          });
    };

    return [...rows].sort(comparator);
  }, [rows, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortLabel = sortDirection === 'desc' ? 'Mais recente' : 'Mais antiga';

  const handleCellUpdate = async (
    orderId: string | undefined,
    field: string,
    value: any,
  ) => {
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

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[2400px]">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th
                className="p-2 text-left border"
                aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}
              >
                <button
                  type="button"
                  onClick={toggleSortDirection}
                  className={cn(
                    'flex items-center gap-2 text-left font-semibold transition-colors hover:text-primary',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  )}
                >
                  <span className="flex flex-col items-start leading-tight">
                    <span>OS SSGen</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {sortLabel}
                    </span>
                  </span>
                  {sortDirection === 'asc' ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">Alternar ordenação</span>
                </button>
              </th>
              <th className="p-2 text-left border">Data</th>
              <th className="p-2 text-left border">OS Neogen</th>
              <th className="p-2 text-left border">Nome</th>
              <th className="p-2 text-left border">CPF/CNPJ</th>
              <th className="p-2 text-left border">IE/RG</th>
              <th className="p-2 text-left border">Código</th>
              <th className="p-2 text-left border">Status</th>
              <th className="p-2 text-left border">Representante</th>
              <th className="p-2 text-left border">Coordenador</th>
              <th className="p-2 text-left border">ID Conta</th>
              <th className="p-2 text-left border">NF Neogen</th>
              <th className="p-2 text-left border">Produto</th>
              <th className="p-2 text-left border">N° Amostras</th>
              <th className="p-2 text-left border">CRA Data</th>
              <th className="p-2 text-left border">CRA Status</th>
              <th className="p-2 text-left border">Envio Plan. Data</th>
              <th className="p-2 text-left border">Envio Plan. Status</th>
              <th className="p-2 text-left border">Envio Plan. SLA</th>
              <th className="p-2 text-left border">VRI Data</th>
              <th className="p-2 text-left border">VRI N° Amostras</th>
              <th className="p-2 text-left border">VRI Resolvido</th>
              <th className="p-2 text-left border">VRI SLA</th>
              <th className="p-2 text-left border">LPR Data</th>
              <th className="p-2 text-left border">LPR N° Amostras</th>
              <th className="p-2 text-left border">LPR SLA</th>
              <th className="p-2 text-left border">Env. Result. Data</th>
              <th className="p-2 text-left border">Env. Result. Status</th>
              <th className="p-2 text-left border">Env. Result. SLA</th>
              <th className="p-2 text-left border">Receb. Result. Data</th>
              <th className="p-2 text-left border">Faturamento Data</th>
              <th className="p-2 text-left border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={32}
                  className="p-4 text-center text-muted-foreground"
                >
                  Nenhuma ordem encontrada
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => (
                <tr
                  key={row.ordem_id ?? row.ordem_servico_ssgen ?? idx}
                  className="hover:bg-muted/50"
                >
                  <td className="p-2 border">
                    <button
                      onClick={() => onOpen(row)}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.ordem_servico_ssgen}
                    </button>
                  </td>
                  <td className="p-2 border">{fmt(row.data_cadastro)}</td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.ordem_servico_neogen}
                      onSave={(v) =>
                        handleCellUpdate(
                          row.ordem_id,
                          'ordem_servico_neogen',
                          v,
                        )
                      }
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">{row.cliente_nome || '—'}</td>
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
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'numero_nf_neogen', v)
                      }
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.nome_produto}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'nome_produto', v)
                      }
                      isEditable={isAdmin}
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.numero_amostras}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'numero_amostras', v)
                      }
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.cra_data}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'cra_data', v)
                      }
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.cra_status}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'cra_status', v)
                      }
                      isEditable={isAdmin}
                      type="badge"
                      badgeVariant="secondary"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_planilha_data}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'envio_planilha_data', v)
                      }
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_planilha_status}
                      onSave={(v) =>
                        handleCellUpdate(
                          row.ordem_id,
                          'envio_planilha_status',
                          v,
                        )
                      }
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
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'vri_data', v)
                      }
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_n_amostras}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'vri_n_amostras', v)
                      }
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_resolvido_data}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'vri_resolvido_data', v)
                      }
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
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'lpr_data', v)
                      }
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.lpr_n_amostras}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'lpr_n_amostras', v)
                      }
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
                      onSave={(v) =>
                        handleCellUpdate(
                          row.ordem_id,
                          'envio_resultados_data',
                          v,
                        )
                      }
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_resultados_status}
                      onSave={(v) =>
                        handleCellUpdate(
                          row.ordem_id,
                          'envio_resultados_status',
                          v,
                        )
                      }
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
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'dt_receb_resultados', v)
                      }
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.dt_faturamento}
                      onSave={(v) =>
                        handleCellUpdate(row.ordem_id, 'dt_faturamento', v)
                      }
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
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Apagar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apagar ordem</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Tem certeza que
                                deseja remover a ordem
                                {` ${row.ordem_servico_ssgen ?? ''}`} do
                                sistema?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteOrder(row.ordem_id)}
                              >
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
