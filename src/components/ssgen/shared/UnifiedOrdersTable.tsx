import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UnifiedOrder } from '@/types/ssgen';
import { fmt } from '@/types/ssgen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditableCell } from './EditableCell';
import { SLABadge } from './SLABadge';
import { deleteServiceOrder, updateServiceOrder } from '@/lib/serviceOrdersApi';
import { updateClient } from '@/lib/clientsApi';
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

  type EditableValue = string | number | null;

  const nullableFields = new Set<string>(['ordem_servico_neogen']);
  const clientScopedFields = new Set<string>(['ordem_servico_neogen']);

  const handleCellUpdate = async ({
    orderId,
    clientId,
    field,
    value
  }: {
    orderId?: string;
    clientId?: string;
    field: string;
    value: EditableValue | undefined;
  }) => {
    const targetsClient = clientScopedFields.has(field);

    if (targetsClient && !clientId) {
      toast.error('ID do cliente não encontrado');
      return;
    }

    if (!targetsClient && !orderId) {
      toast.error('ID da ordem não encontrado');
      return;
    }

    try {
      const isNullish = value === null || value === undefined || value === '';

      if (isNullish && !nullableFields.has(field)) {
        toast.error('Este campo não pode ficar em branco');
        throw new Error('Campo obrigatório');
      }

      const payloadValue: EditableValue = isNullish ? null : (value as EditableValue);

      if (field === 'ordem_servico_neogen') {
        const updates: Record<string, EditableValue> = { [field]: payloadValue };
        const updatePromises: Promise<unknown>[] = [];

        if (clientId) {
          updatePromises.push(updateClient(clientId, updates));
        }

        if (orderId) {
          updatePromises.push(updateServiceOrder(orderId, updates));
        }

        if (updatePromises.length === 0) {
          toast.error('Nenhum registro encontrado para atualizar');
          return;
        }

        await Promise.all(updatePromises);
      } else if (orderId) {
        await updateServiceOrder(orderId, { [field]: payloadValue });
      }
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
              <th className="p-2 text-left border">OS SSGen</th>
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={32} className="p-4 text-center text-muted-foreground">
                  Nenhuma ordem encontrada
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  <td className="p-2 border">
                    <button
                      onClick={() => onOpen(row)}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.ordem_servico_ssgen}
                    </button>
                  </td>
                  <td className="p-2 border">{fmt(row.updated_at)}</td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.ordem_servico_neogen}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, clientId: row.id, field: 'ordem_servico_neogen', value: v })}
                      isEditable={isAdmin}
                      type="text"
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
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'numero_nf_neogen', value: v })}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.nome_produto}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'nome_produto', value: v })}
                      isEditable={isAdmin}
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.numero_amostras}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'numero_amostras', value: v })}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.cra_data}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'cra_data', value: v })}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.cra_status}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'cra_status', value: v })}
                      isEditable={isAdmin}
                      type="badge"
                      badgeVariant="secondary"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_planilha_data}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'envio_planilha_data', value: v })}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_planilha_status}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'envio_planilha_status', value: v })}
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
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'vri_data', value: v })}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_n_amostras}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'vri_n_amostras', value: v })}
                      isEditable={isAdmin}
                      type="number"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.vri_resolvido_data}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'vri_resolvido_data', value: v })}
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
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'lpr_data', value: v })}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.lpr_n_amostras}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'lpr_n_amostras', value: v })}
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
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'envio_resultados_data', value: v })}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.envio_resultados_status}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'envio_resultados_status', value: v })}
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
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'dt_receb_resultados', value: v })}
                      isEditable={isAdmin}
                      type="date"
                    />
                  </td>
                  <td className="p-2 border">
                    <EditableCell
                      value={row.dt_faturamento}
                      onSave={(v) => handleCellUpdate({ orderId: row.ordem_id, field: 'dt_faturamento', value: v })}
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