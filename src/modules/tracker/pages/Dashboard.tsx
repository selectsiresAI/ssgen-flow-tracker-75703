import { useState, useMemo } from 'react';
import { useTrackerTimelines } from '../hooks/useTrackerData';
import { useTrackerKpis } from '../hooks/useTrackerKpis';
import { OrdersTable } from '../components/OrdersTable';
import { OrderCard } from '../components/OrderCard';
import { AlertCenter } from '../components/AlertCenter';
import { KpiCards } from '../components/KpiCards';
import { KpiSlaBlock } from '../components/KpiSlaBlock';
import { useOrderAlarms } from '../hooks/useOrderAlarms';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';

export default function TrackerDashboard() {
  const { data: rows = [] } = useTrackerTimelines();
  const { data: kpis, isLoading: loadingKpis } = useTrackerKpis();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'table' | 'cards'>('table');
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { criticalCount, warningCount } = useOrderAlarms(rows, {
    enabled: alarmsEnabled,
    soundEnabled,
    criticalThreshold: 5,
    warningThreshold: 3,
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      return !q ||
        String(r.ordem_servico_ssgen ?? '').toLowerCase().includes(q) ||
        String(r.cliente ?? '').toLowerCase().includes(q);
    });
  }, [rows, query]);

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
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
            {alarmsEnabled ? <Bell className="w-4 h-4 text-black" /> : <BellOff className="w-4 h-4 text-black" />}
            <Switch checked={alarmsEnabled} onCheckedChange={setAlarmsEnabled} />
            <Label className="text-xs text-black cursor-pointer" onClick={() => setAlarmsEnabled(!alarmsEnabled)}>
              Alarmes
            </Label>
          </div>
          {alarmsEnabled && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              <Label className="text-xs text-black cursor-pointer" onClick={() => setSoundEnabled(!soundEnabled)}>
                Som
              </Label>
            </div>
          )}
          <Input
            placeholder="Buscar por OS ou cliente..."
            className="w-80 bg-white text-black border-gray-300"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            onClick={() => setMode(m => m === 'table' ? 'cards' : 'table')}
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
        <OrdersTable rows={filtered} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <OrderCard 
              key={r.id} 
              row={r} 
              onOpen={() => {}} 
              onMap={() => {}} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
