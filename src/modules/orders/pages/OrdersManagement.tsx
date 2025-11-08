import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
import { getProfile } from '@/lib/ssgenClient';

interface PowerRow {
  id?: string;
  OS_SSGEN: string;
  CLIENTE?: string | null;
  COORD?: string | null;
  REP?: string | null;
  PROD_SSG?: string | null;
  N_AMOSTRAS_SSG?: number | null;
  DT_SSGEN_OS?: string | null;
  DT_PREV_RESULT_SSG?: string | null;
  RESULT_SSG?: string | null;
  DT_RESULT_SSG?: string | null;
  FATUR_TIPO?: string | null;
  FATUR_SSG?: number | null;
  DT_FATUR_SSG?: string | null;
  OS_NEOGEN?: string | null;
  PLAN_NEOGEN?: string | null;
  DT_CRA?: string | null;
  DT_PLAN_NEOGEN?: string | null;
  DT_VRI?: string | null;
  DT_LPR?: string | null;
  DT_LR?: string | null;
  N_VRI?: number | null;
  N_LPR?: number | null;
  N_LR?: number | null;
  LR_RASTREIO?: string | null;
}

type StageConfig = {
  view: keyof PowerRow;
};

const fieldMap: Record<string, StageConfig> = {
  CRA: { view: 'DT_CRA' },
  PLANILHA: { view: 'DT_PLAN_NEOGEN' },
  VRI: { view: 'DT_VRI' },
  LPR: { view: 'DT_LPR' },
  LR: { view: 'DT_LR' },
  RESULTADOS: { view: 'DT_RESULT_SSG' },
  FATURAR: { view: 'DT_FATUR_SSG' },
};

type StageKey = keyof typeof fieldMap;

const stageOrder: StageKey[] = ['CRA', 'PLANILHA', 'VRI', 'LPR', 'LR', 'RESULTADOS', 'FATURAR'];

const formatDate = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');

async function fetchOrders(): Promise<PowerRow[]> {
  const { data, error } = await supabase.from('vw_orders_powerbi').select('*');
  if (error) {
    console.error('Erro ao carregar ordens', error);
    return [];
  }
  return (data ?? []) as PowerRow[];
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch (error) {
    console.error('Erro ao buscar usuário atual', error);
    return null;
  }
}

async function updateOrderById(orderId: string, field: string, oldValue: string | null, value: string | null) {
  const { error } = await supabase
    .from('orders')
    .update({ [field]: value })
    .eq('id', orderId);

  if (error) {
    throw error;
  }

  // Log audit trail
  await logOrderChange({
    order_id: orderId,
    field_name: field,
    old_value: oldValue,
    new_value: value,
  });
}

async function updateOrderByCode(os_ssgen: string, field: string, oldValue: string | null, value: string | null) {
  const { error } = await supabase
    .from('orders')
    .update({ [field]: value })
    .eq('os_ssgen', os_ssgen);

  if (error) {
    throw error;
  }

  // Log audit trail
  await logOrderChange({
    ordem_servico_ssgen: os_ssgen,
    field_name: field,
    old_value: oldValue,
    new_value: value,
  });
}

interface EtapasRowProps {
  row: PowerRow;
  onChange: (row: PowerRow) => void;
  onDelete: (row: PowerRow) => Promise<void>;
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

    const { view } = fieldMap[label];
    const oldValue = row[view] as string | null;
    const updated = { ...row, [view]: value } as PowerRow;
    onChange(updated);
    setSaving(label);
    setErrorStage(null);

    try {
      if (row.id) {
        await updateOrderById(row.id, String(view).toLowerCase(), oldValue, value);
      } else {
        await updateOrderByCode(row.OS_SSGEN, String(view).toLowerCase(), oldValue, value);
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
      <td className="p-3 whitespace-nowrap">{row.PROD_SSG || 'SSGEN'}</td>
      <td className="p-3 whitespace-nowrap">{currentStage}</td>
      {stageOrder.map((label) => renderField(label))}
      <td className="p-3"><Badge variant="outline">média</Badge></td>
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
            <Button variant="destructive" size="sm" className="gap-1" disabled={!row.id}>
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
  const [rows, setRows] = useState<PowerRow[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrders();
      setRows(data);
      
      // Check if user is ADM
      const profile = await getProfile();
      setIsAdmin(profile?.role === 'ADM');
    };
    load();
  }, []);

  const updateRow = (updated: PowerRow) => {
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

  const handleDeleteRow = async (row: PowerRow) => {
    if (!row.id) {
      toast.error('Não é possível apagar esta ordem porque o ID não foi encontrado.');
      return;
    }

    try {
      await deleteServiceOrder(row.id);
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
        <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
          <Upload className="w-4 h-4" /> Importar Excel
        </Button>
      </HeaderBar>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[1400px] text-sm">
          <thead className="bg-muted/40 sticky top-0">
            <tr className="text-left">
              <th className="p-3">OS SSGEN</th>
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

