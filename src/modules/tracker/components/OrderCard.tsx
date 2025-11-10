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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-black">
          OS <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-black">{row.ordem_servico_ssgen}</span>
        </div>
        <div className="text-xs text-black">{row.etapa_atual ?? '-'}</div>
      </div>
      <div className="text-sm text-black">{row.cliente}</div>
      <TimelineNine steps={steps} />
      <div className="text-xs text-black flex items-center justify-between">
        <span>
          Aging:{' '}
          {aging === null ? (
            '-'
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-black">{aging}d</span>
          )}
        </span>
        <span className={`px-2 py-1 rounded text-black ${row.prioridade === 'alta' ? 'bg-red-200' : 'bg-gray-200'}`}>
          {row.prioridade ?? 'média'}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 rounded bg-gray-200 text-black hover:bg-gray-300 text-sm"
          onClick={() => onOpen(row)}
        >
          Detalhes
        </button>
        <button
          className="px-3 py-1.5 rounded bg-gray-200 text-black hover:bg-gray-300 text-sm"
          onClick={() => onMap(row)}
        >
          Mapa
        </button>
      </div>
    </div>
  );
}
