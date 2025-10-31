import { TimelineNine } from './TimelineNine';
import type { TrackerTimeline } from '@/types/ssgen';

export function OrderCard({ 
  row, 
  onOpen, 
  onMap 
}: {
  row: TrackerTimeline;
  onOpen: (r: TrackerTimeline) => void;
  onMap: (r: TrackerTimeline) => void;
}) {
  const steps: Array<{ name: string; status: 'done' | 'pending' | 'late' }> = [
    { name: 'CRA', status: row.etapa1_cra_data ? 'done' : 'pending' },
    { name: 'Envio Planilha', status: row.etapa2_envio_planilha_data ? 'done' : 'pending' },
    { name: 'VRI', status: row.etapa3_vri_data ? 'done' : 'pending' },
    { name: 'VRI Resolução', status: row.etapa4_vri_resolucao_data ? 'done' : 'pending' },
    { name: 'LPR', status: row.etapa5_lpr_data ? 'done' : 'pending' },
    { name: 'Receb. Resultados', status: row.etapa6_receb_resultados_data ? 'done' : 'pending' },
    { name: 'Envio Resultados', status: row.etapa7_envio_resultados_data ? 'done' : 'pending' },
    { name: 'Faturamento', status: row.etapa8_faturamento_data ? 'done' : 'pending' },
  ];

  const aging = row.aging_dias_total ?? null;

  return (
    <div className="rounded-2xl border border-zenith-navy/30 bg-zenith-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">OS {row.ordem_servico_ssgen}</div>
        <div className="text-xs text-zenith-gray">{row.etapa_atual ?? '-'}</div>
      </div>
      <div className="text-sm text-zenith-gray">{row.cliente}</div>
      <TimelineNine steps={steps} />
      <div className="text-xs text-zenith-gray flex items-center justify-between">
        <span>Aging: {aging === null ? '-' : `${aging}d`}</span>
        <span className={`px-2 py-1 rounded ${row.prioridade === 'alta' ? 'bg-red-500/20 text-red-400' : 'bg-zenith-navy'}`}>
          {row.prioridade ?? 'média'}
        </span>
      </div>
      <div className="flex gap-2">
        <button 
          className="px-3 py-1.5 rounded bg-zenith-navy text-white hover:opacity-90 text-sm"
          onClick={() => onOpen(row)}
        >
          Detalhes
        </button>
        <button 
          className="px-3 py-1.5 rounded bg-zenith-navy text-white hover:opacity-90 text-sm"
          onClick={() => onMap(row)}
        >
          Mapa
        </button>
      </div>
    </div>
  );
}
