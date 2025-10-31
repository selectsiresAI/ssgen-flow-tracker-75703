import { useState, useMemo } from 'react';
import { useTrackerTimelines, useTrackerKPIs } from '../hooks/useTrackerData';
import { GaugeSLA } from '../components/GaugeSLA';
import { OrdersTable } from '../components/OrdersTable';
import { OrderCard } from '../components/OrderCard';
import { AlertCenter } from '../components/AlertCenter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TrackerDashboard() {
  const { data: rows = [] } = useTrackerTimelines();
  const { data: kpis } = useTrackerKPIs();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'table' | 'cards'>('table');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      return !q ||
        String(r.ordem_servico_ssgen ?? '').toLowerCase().includes(q) ||
        String(r.cliente ?? '').toLowerCase().includes(q);
    });
  }, [rows, query]);

  const k = kpis ?? {
    total_os: 0,
    em_processamento: 0,
    a_faturar: 0,
    concluidas_hoje: 0,
    pct_sla_envio_ok: 0,
    pct_sla_vri_ok: 0,
    pct_sla_lpr_ok: 0,
    pct_sla_envio_res_ok: 0,
    tma_dias: 0,
  };

  return (
    <div className="p-6 space-y-6 bg-zenith-black min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-3xl font-bold text-white">SSGEN Tracker</div>
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Buscar por OS ou cliente..."
            className="w-80 bg-zenith-bg text-white border-zenith-navy"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            onClick={() => setMode(m => m === 'table' ? 'cards' : 'table')}
            variant="outline"
            className="bg-zenith-navy text-white border-zenith-navy hover:bg-zenith-navy/80"
          >
            {mode === 'table' ? 'Cards' : 'Tabela'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI title="Total OS" value={k.total_os} />
        <KPI title="Em Processamento" value={k.em_processamento} />
        <KPI title="A Faturar" value={k.a_faturar} />
        <KPI title="Concluídas Hoje" value={k.concluidas_hoje} />
        <KPI title="TMA (dias)" value={k.tma_dias?.toFixed(1) ?? '-'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="grid grid-cols-2 gap-3">
          <GaugeSLA value={k.pct_sla_envio_ok} label="SLA Envio Planilha" />
          <GaugeSLA value={k.pct_sla_vri_ok} label="SLA VRI" />
          <GaugeSLA value={k.pct_sla_lpr_ok} label="SLA LPR" />
          <GaugeSLA value={k.pct_sla_envio_res_ok} label="SLA Envio Resultados" />
        </div>
        <AlertCenter rows={rows} />
        <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
          <div className="text-zenith-gold font-semibold mb-2">Resumo Executivo</div>
          <div className="text-sm text-zenith-gray space-y-2">
            <p>Operação com {k.em_processamento} OS ativas.</p>
            <p>Priorize etapas críticas para manter SLA.</p>
          </div>
        </div>
      </div>

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

function KPI({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl p-4 bg-zenith-card border border-zenith-navy/30">
      <div className="text-zenith-gold text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
