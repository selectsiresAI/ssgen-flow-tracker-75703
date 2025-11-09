import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import ImportDialog from '@/components/ssgen/import/ImportDialog';
import { HeaderBar } from '@/components/ssgen/shared/HeaderBar';
import { deleteServiceOrder } from '@/lib/trackerApi';
import { logOrderChange } from '@/lib/orderAuditApi';
import InlineClientEditor from '@/components/orders/InlineClientEditor';
import {
  fetchOrders as fetchUnifiedOrderRows,
  getProfile,
  POWER_ROW_TO_SERVICE_ORDER_FIELD,
} from '@/lib/ssgenClient';
import { fetchManagementOrders, type ManagementOrderRow } from '@/lib/fetchOrders';
import type { Database } from '@/lib/supabaseClient';
import type { PowerRow } from '@/types/ssgen';

type ServiceOrderColumn = keyof Database['public']['Tables']['service_orders']['Row'];

type StageConfig = {
  view: keyof PowerRow;
  column?: ServiceOrderColumn;
};

type OrdersManagementRow = PowerRow & {
  client_id: string | null;
  client_name: string | null;
};

const fieldMap: Record<string, StageConfig> = {
  CRA: { view: 'DT_CRA', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_CRA },
  PLANILHA: { view: 'DT_PLAN_NEOGEN', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_PLAN_NEOGEN },
  VRI: { view: 'DT_VRI', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_VRI },
  LPR: { view: 'DT_LPR', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_LPR },
  LR: { view: 'DT_LR', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_LR },
  RESULTADOS: { view: 'DT_RESULT_SSG', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_RESULT_SSG },
  FATURAR: { view: 'DT_FATUR_SSG', column: POWER_ROW_TO_SERVICE_ORDER_FIELD.DT_FATUR_SSG },
};

type StageKey = keyof typeof fieldMap;

const stageOrder: StageKey[] = ['CRA', 'PLANILHA', 'VRI', 'LPR', 'LR', 'RESULTADOS', 'FATURAR'];

const formatDate = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');

async function updateOrderById(
  orderId: string,
  column: ServiceOrderColumn,
  oldValue: string | null,
  value: string | null
) {
  const { error } = await supabase
    .from('service_orders')
    .update({ [column]: value })
    .eq('id', orderId)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  // Log audit trail
  await logOrderChange({
    order_id: orderId,
    field_name: column,
    old_value: oldValue,
    new_value: value,
  });
}

async function updateOrderByCode(
  os_ssgen: number,
  column: ServiceOrderColumn,
  oldValue: string | null,
  value: string | null
) {
  const { error } = await supabase
    .from('service_orders')
    .update({ [column]: value })
    .eq('ordem_servico_ssgen', os_ssgen)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  // Log audit trail
  await logOrderChange({
    ordem_servico_ssgen: String(os_ssgen),
    field_name: column,
    old_value: oldValue,
    new_value: value,
  });
}

interface EtapasRowProps {
  row: OrdersManagementRow;
  onChange: (row: OrdersManagementRow) => void;
  onDelete: (row: OrdersManagementRow) => Promise<void>;
  isAdmin: boolean;
}

const EtapasRow: React.FC<EtapasRowProps> = ({ row, onChange, onDelete, isAdmin }) => {
  const [saving, setSaving] = useState<StageKey | null>(null);
  const [errorStage, setErrorStage] = useState<StageKey | null>(null);

  const persistField = async (label: StageKey, value: string | null) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar as etapas das ordens.');
      return;
    }

    const { view, column } = fieldMap[label];

    if (!column) {
      toast.error('Campo não configurado para atualização.');
      return;
    }

    const oldValue = row[view] as string | null;
    const updated = { ...row, [view]: value } as OrdersManagementRow;
    onChange(updated);
    setSaving(label);
    setErrorStage(null);

    try {
      if (row.id) {
        await updateOrderById(row.id, column, oldValue, value);
      } else {
        const osValue = typeof row.OS_SSGEN === 'number'
          ? row.OS_SSGEN
          : Number.parseInt(row.OS_SSGEN ?? '', 10);

        if (!Number.isFinite(osValue)) {
          throw new Error('Número da ordem inválido para atualização.');
        }

        await updateOrderByCode(osValue, column, oldValue, value);
      }
      toast.success(`Etapa ${label} atualizada com sucesso.`);
    } catch (error) {
      console.error(`Erro ao salvar etapa ${label}`, error);
      setErrorStage(label);
      onChange(row);
      toast.error(`Erro ao salvar etapa ${label}.`);
    } finally {
      setSaving(null);
    }
  };

  const currentStage = useMemo(() => {
    if (row.DT_FATUR_SSG) return 'Faturar';
    if (row.DT_RESULT_SSG) return 'Envio de Resultados';
    if (row.DT_LR) return 'LR';
    if (row.DT_LPR) return 'LPR';
    if (row.DT_VRI) return 'VRI';
    if (row.DT_PLAN_NEOGEN) return 'Envio de Planilha';
    if (row.DT_CRA) return 'CRA';
    return 'Aguardando…';
  }, [row]);

  const agingBase = useMemo(() => {
    return (
      row.DT_FATUR_SSG ||
      row.DT_RESULT_SSG ||
      row.DT_LR ||
      row.DT_LPR ||
      row.DT_VRI ||
      row.DT_PLAN_NEOGEN ||
      row.DT_CRA ||
      row.DT_SSGEN_OS ||
      null
    );
  }, [row]);

  const aging = useMemo(() => {
    if (!agingBase) return null;
    const baseDate = new Date(agingBase).getTime();
    if (Number.isNaN(baseDate)) return null;
    const diff = Date.now() - baseDate;
    return Math.round(diff / 86_400_000);
  }, [agingBase]);

  const priorityLabel = useMemo(() => {
    const base = row.prioridade ?? 'media';
    const normalized = base === 'media' ? 'média' : base;
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [row.prioridade]);

  const renderField = (label: StageKey) => {
    const { view } = fieldMap[label];
    const value = row[view];
    const savingThisField = saving === label;
    const hasError = errorStage === label;

    return (
      <td className="p-3">
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="border rounded-md px-2 py-1 bg-background"
            value={formatDate(value as string | null)}
            onChange={(event) => persistField(label, event.target.value || null)}
            disabled={!isAdmin}
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={savingThisField || !isAdmin}
            onClick={() => persistField(label, null)}
          >
            Limpar
          </Button>
          {savingThisField && <Badge variant="secondary">Salvando…</Badge>}
          {hasError && <Badge variant="destructive">Erro</Badge>}
        </div>
      </td>
    );
  };

  return (
    <tr className="border-t align-top">
      <td className="p-3 font-medium whitespace-nowrap">{row.OS_SSGEN}</td>
      <td className="p-3 whitespace-nowrap">
        {row.id ? (
          <InlineClientEditor
            orderId={row.id}
            initialName={
              row.client_name ??
              (typeof row.CLIENTE === 'string' && row.CLIENTE.trim().length > 0
                ? row.CLIENTE
                : null)
            }
            onCommitted={(payload) =>
              onChange({
                ...row,
                CLIENTE: payload.client_name ?? '',
                client_name: payload.client_name ?? null,
                client_id: payload.client_id ?? null,
              })
            }
          />
        ) : (
          row.CLIENTE || '—'
        )}
      </td>
      <td className="p-3 whitespace-nowrap">{row.PROD_SSG || 'SSGEN'}</td>
      <td className="p-3 whitespace-nowrap">{currentStage}</td>
      {stageOrder.map((label) => renderField(label))}
      <td className="p-3"><Badge variant="outline">{priorityLabel}</Badge></td>
      <td className="p-3">
        <Badge variant="outline">{aging === null ? '—' : `${aging}d`}</Badge>
      </td>
      <td className="p-3">
        {saving ? (
          <Badge variant="secondary">Atualizando…</Badge>
        ) : (
          <Badge variant="success">OK</Badge>
        )}
      </td>
      <td className="p-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              disabled={!row.id || !isAdmin}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden 2xl:inline">Apagar</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar ordem</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Tem certeza que deseja apagar a ordem {row.OS_SSGEN}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(row)}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
};

const OrdersManagement: React.FC = () => {
  const [rows, setRows] = useState<OrdersManagementRow[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [powerRows, managementRows] = await Promise.all([
        fetchUnifiedOrderRows(),
        fetchManagementOrders(),
      ]);

      const activeManagementRows = managementRows.filter((row) => row.deleted_at == null);

      const viewById = new Map<string, ManagementOrderRow>();
      activeManagementRows.forEach((row) => {
        if (row.id) {
          viewById.set(row.id, row);
        }
      });

      const merged: OrdersManagementRow[] = powerRows.map((row) => {
        const view = row.id ? viewById.get(row.id) : undefined;
        const fallbackName =
          typeof row.CLIENTE === 'string' && row.CLIENTE.trim().length > 0
            ? row.CLIENTE
            : null;
        const resolvedClientName = view?.client_name ?? fallbackName ?? null;

        return {
          ...row,
          CLIENTE: resolvedClientName ?? '',
          client_name: resolvedClientName,
          client_id: view?.client_id ?? null,
        } satisfies OrdersManagementRow;
      });

      setRows(merged);
    } catch (error: unknown) {
      console.error('Erro ao carregar ordens', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar ordens';
      setErrorMsg(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await load();
      const profile = await getProfile();
      setIsAdmin(profile?.role === 'ADM');
    };
    void init();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('orders-management-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_orders' },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const updateRow = (updated: OrdersManagementRow) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === updated.id || row.OS_SSGEN === updated.OS_SSGEN ? updated : row,
      ),
    );
  };

  const filteredRows = useMemo(() => {
    if (!query) return rows;
    const lower = query.toLowerCase();
    return rows.filter((row) => {
      const fields = [row.OS_SSGEN, row.CLIENTE ?? '', row.REP ?? '', row.COORD ?? ''];
      return fields.some((field) => field?.toLowerCase().includes(lower));
    });
  }, [query, rows]);

  const handleDeleteRow = async (row: OrdersManagementRow) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem apagar ordens.');
      return;
    }

    if (!row.id) {
      toast.error('Não é possível apagar esta ordem porque o ID não foi encontrado.');
      return;
    }

    try {
      const sourceTable = row.source_table === 'orders' ? 'orders' : 'service_orders';
      await deleteServiceOrder(row.id, sourceTable);
      setRows((prev) =>
        prev.filter((item) => (item.id ?? item.OS_SSGEN) !== (row.id ?? row.OS_SSGEN)),
      );
      toast.success('Ordem apagada com sucesso.');
    } catch (error) {
      console.error('Erro ao apagar ordem', error);
      toast.error('Erro ao apagar ordem. Tente novamente.');
    }
  };

  return (
    <div className="space-y-4 p-6">
      <HeaderBar title="Gestão de Ordens" query={query} setQuery={setQuery}>
        {isAdmin && (
          <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" /> Importar Excel
          </Button>
        )}
      </HeaderBar>

      {errorMsg && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[1400px] text-sm">
          <thead className="bg-muted/40 sticky top-0">
            <tr className="text-left">
              <th className="p-3">OS SSGEN</th>
              <th className="p-3">Nome do cliente</th>
              <th className="p-3">Produto</th>
              <th className="p-3">Etapa</th>
              <th className="p-3">CRA</th>
              <th className="p-3">Envio de Planilha</th>
              <th className="p-3">VRI</th>
              <th className="p-3">LPR</th>
              <th className="p-3">LR</th>
              <th className="p-3">Envio de Resultados</th>
              <th className="p-3">Faturar</th>
              <th className="p-3">Prioridade</th>
              <th className="p-3">Aging</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <EtapasRow key={row.id ?? row.OS_SSGEN} row={row} onChange={updateRow} onDelete={handleDeleteRow} isAdmin={isAdmin} />
            ))}
          </tbody>
        </table>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default OrdersManagement;

