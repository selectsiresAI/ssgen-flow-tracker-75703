import type { TrackerTimeline } from '@/types/ssgen';

export function AlertCenter({ rows }: { rows: TrackerTimeline[] }) {
  const critical = rows.filter((r) => r.etapa_atual && (r.aging_dias_total ?? 0) > 5);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 h-full">
      <div className="text-black mb-3 font-semibold">Alertas Críticos</div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {critical.map((r) => (
          <div
            key={r.id}
            className="p-3 rounded-xl border border-red-200 bg-red-100 flex justify-between items-center"
          >
            <div className="text-sm text-black">
              <div className="font-semibold">
                OS <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-black">{r.ordem_servico_ssgen}</span>
              </div>
              <div className="text-xs text-black">
                {r.cliente} • {r.etapa_atual} •
                <span className="inline-flex items-center px-2 py-0.5 ml-1 rounded bg-gray-100 text-black">
                  +{r.aging_dias_total}d
                </span>
              </div>
            </div>
            <button className="px-2 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 text-xs flex-shrink-0">
              Ver
            </button>
          </div>
        ))}
        {critical.length === 0 && (
          <div className="text-xs text-black text-center py-4">
            Nenhum alerta crítico no momento
          </div>
        )}
      </div>
    </div>
  );
}
