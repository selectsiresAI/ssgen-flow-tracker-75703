import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { withRole } from '@/components/auth/withRole';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CalendarDays } from 'lucide-react';
import { OrdersTable } from '../components/OrdersTable';
import { OrderCard } from '../components/OrderCard';
import { AlertCenter } from '../components/AlertCenter';
import { KpiCards } from '../components/KpiCards';
import { KpiSlaBlock } from '../components/KpiSlaBlock';
import { useTrackerTimelines } from '../hooks/useTrackerData';
import { useTrackerKpis } from '../hooks/useTrackerKpis';
import { useOrderAlarms } from '../hooks/useOrderAlarms';
import type { TrackerTimeline } from '@/types/ssgen';

const STEP_LABELS: Array<{
  key: keyof TrackerTimeline;
  label: string;
  slaKey?: keyof TrackerTimeline;
}> = [
  { key: 'etapa1_cra_data', label: 'CRA' },
  { key: 'etapa2_envio_planilha_data', label: 'Envio Planilha', slaKey: 'etapa2_status_sla' },
  { key: 'etapa3_vri_data', label: 'VRI', slaKey: 'etapa3_status_sla' },
  { key: 'etapa4_vri_resolucao_data', label: 'VRI Resolução' },
  { key: 'etapa5_lpr_data', label: 'LPR', slaKey: 'etapa5_status_sla' },
  { key: 'etapa6_receb_resultados_data', label: 'Receb. Resultados' },
  { key: 'etapa7_envio_resultados_data', label: 'Envio Resultados', slaKey: 'etapa7_status_sla' },
  { key: 'etapa8_faturamento_data', label: 'Faturamento' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

const renderSlaBadge = (value?: string | null) => {
  if (!value) return null;
  if (value === 'no_prazo') return <Badge variant="success">No Prazo</Badge>;
  if (value === 'dia_zero') return <Badge variant="warning">Dia Zero</Badge>;
  if (value === 'atrasado') return <Badge variant="destructive">Atrasado</Badge>;
  return <Badge variant="outline">{value}</Badge>;
};

function TrackerDashboard() {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId') ?? undefined;
  const { data: rows = [] } = useTrackerTimelines(accountId);
  const { data: kpis, isLoading: loadingKpis } = useTrackerKpis(accountId);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'table' | 'cards'>('table');
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<TrackerTimeline | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { criticalCount, warningCount } = useOrderAlarms(rows, {
    enabled: alarmsEnabled,
    soundEnabled,
    criticalThreshold: 5,
    warningThreshold: 3,
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      return (
        !q ||
        String(r.ordem_servico_ssgen ?? '').toLowerCase().includes(q) ||
        String(r.cliente ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const handleOpenDetails = (row: TrackerTimeline) => {
    setSelectedOrder(row);
    setDetailOpen(true);
  };

  const handleDetailOpenChange = (open: boolean) => {
    if (!open) {
      setDetailOpen(false);
      setSelectedOrder(null);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-black">SSGEN Tracker</div>
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-black text-xs font-semibold ring-1 ring-destructive/60">
                  {criticalCount} Crítico{criticalCount !== 1 ? 's' : ''}
                </div>
              )}
              {warningCount > 0 && (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-black text-xs font-semibold ring-1 ring-warning/60">
                  {warningCount} Aviso{warningCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Switch
              id="alarms-toggle"
              checked={alarmsEnabled}
              onCheckedChange={setAlarmsEnabled}
            />
            <Label htmlFor="alarms-toggle" className="text-sm text-black flex items-center gap-1">
              {alarmsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              Alarmes
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              disabled={!alarmsEnabled}
            />
            <Label htmlFor="sound-toggle" className="text-sm text-black">
              Som
            </Label>
          </div>
          <Input
            placeholder="Buscar por OS ou cliente..."
            className="w-72 bg-white text-black border-gray-300"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            onClick={() => setMode((m) => (m === 'table' ? 'cards' : 'table'))}
            variant="outline"
            className="bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            {mode === 'table' ? 'Cards' : 'Tabela'}
          </Button>
        </div>
      </div>

      {loadingKpis ? (
        <div className="text-center text-black py-8">Carregando KPIs...</div>
      ) : (
        <>
          <KpiCards k={kpis} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <KpiSlaBlock k={kpis} />
            <div className="grid grid-cols-1 gap-4">
              <AlertCenter rows={rows} />
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="text-black font-semibold mb-2">Resumo Executivo</div>
                <div className="text-sm text-black space-y-2">
                  <p>
                    Operação com{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-black">
                      {kpis?.em_processamento ?? 0}
                    </span>{' '}
                    OS ativas.
                  </p>
                  <p>Priorize etapas críticas para manter SLA.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {mode === 'table' ? (
        <OrdersTable rows={filtered} onOpen={handleOpenDetails} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <OrderCard key={r.id} row={r} onOpen={handleOpenDetails} onMap={() => {}} />
          ))}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da OS {selectedOrder?.ordem_servico_ssgen ?? '—'}</DialogTitle>
            <DialogDescription>{selectedOrder?.cliente ?? 'Cliente não informado'}</DialogDescription>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-4 text-sm text-black">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Etapa atual: <strong>{selectedOrder.etapa_atual ?? '—'}</strong>
                  </span>
                </div>
                <div>
                  Prioridade: <Badge variant="secondary">{selectedOrder.prioridade ?? '—'}</Badge>
                </div>
                <div>
                  Aging total: <Badge variant="outline">{selectedOrder.aging_dias_total ?? '—'} dias</Badge>
                </div>
                {selectedOrder.flag_reagendamento ? (
                  <Badge variant="destructive" className="justify-self-start">
                    Reagendado
                  </Badge>
                ) : null}
              </div>

              <div className="border rounded-xl divide-y divide-gray-100 overflow-hidden">
                {STEP_LABELS.map((step) => {
                  const dateValue = selectedOrder[step.key];
                  const slaValue = step.slaKey ? selectedOrder[step.slaKey] : undefined;
                  return (
                    <div key={step.key as string} className="flex items-center justify-between px-4 py-2 bg-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{step.label}</span>
                        <span className="text-xs text-gray-500">{formatDate(dateValue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderSlaBadge(typeof slaValue === 'string' ? slaValue : undefined)}
                        <Badge variant={dateValue ? 'success' : 'outline'}>
                          {dateValue ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedOrder.issue_text ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                  <div className="text-xs uppercase tracking-wide font-semibold">Observações</div>
                  <p className="text-sm mt-1">{selectedOrder.issue_text}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withRole(['ADM', 'GERENTE', 'REPRESENTANTE'])(TrackerDashboard);
