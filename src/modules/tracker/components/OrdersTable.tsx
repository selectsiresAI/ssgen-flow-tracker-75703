import type { TrackerTimeline } from '@/types/ssgen';

export function OrdersTable({ rows }: { rows: TrackerTimeline[] }) {
  return (
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-4 text-lg font-semibold">Tabela Mestre</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-white">
          <thead>
            <tr className="border-b border-zenith-navy/30">
              <th className="text-left p-3 text-zenith-gray font-medium">OS</th>
              <th className="text-left p-3 text-zenith-gray font-medium">Cliente</th>
              <th className="text-left p-3 text-zenith-gray font-medium">Prioridade</th>
              <th className="text-left p-3 text-zenith-gray font-medium">Etapa Atual</th>
              <th className="text-left p-3 text-zenith-gray font-medium">Aging (d)</th>
              <th className="text-left p-3 text-zenith-gray font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zenith-navy/20 hover:bg-zenith-navy/20">
                <td className="p-3">{r.ordem_servico_ssgen}</td>
                <td className="p-3">{r.cliente}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    r.prioridade === 'alta' ? 'bg-red-500/20 text-red-400' : 'bg-zenith-navy'
                  }`}>
                    {r.prioridade ?? 'média'}
                  </span>
                </td>
                <td className="p-3">{r.etapa_atual ?? '-'}</td>
                <td className="p-3">{r.aging_dias_total ?? '-'}</td>
                <td className="p-3">
                  <button className="px-3 py-1 rounded bg-zenith-navy text-white hover:opacity-90 text-xs">
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
