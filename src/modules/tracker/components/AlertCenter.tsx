import type { TrackerTimeline } from '@/types/ssgen';

export function AlertCenter({ rows }: { rows: TrackerTimeline[] }) {
  const critical = rows.filter((r) => r.etapa_atual && (r.aging_dias_total ?? 0) > 5);

  return (
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30 h-full">
      <div className="text-zenith-gold mb-3 font-semibold">Alertas Críticos</div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {critical.map((r) => (
          <div 
            key={r.id} 
            className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex justify-between items-center"
          >
            <div className="text-sm text-white">
              <div className="font-semibold">
                OS <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/90 text-black">{r.ordem_servico_ssgen}</span>
              </div>
              <div className="text-xs text-zenith-gray">
                {r.cliente} • {r.etapa_atual} •
                <span className="inline-flex items-center px-2 py-0.5 ml-1 rounded bg-white/90 text-black">
                  +{r.aging_dias_total}d
                </span>
              </div>
            </div>
            <button className="px-2 py-1 rounded bg-zenith-navy text-white hover:opacity-90 text-xs flex-shrink-0">
              Ver
            </button>
          </div>
        ))}
        {critical.length === 0 && (
          <div className="text-xs text-zenith-gray text-center py-4">
            Nenhum alerta crítico no momento
          </div>
        )}
      </div>
    </div>
  );
}
