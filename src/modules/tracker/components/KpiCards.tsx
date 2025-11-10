import type { TrackerKPI } from '@/types/ssgen';

interface KpiCardsProps {
  k?: TrackerKPI | null;
}

export function KpiCards({ k }: KpiCardsProps) {
  if (!k) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-2xl p-4 bg-zenith-card border border-zenith-navy/30 animate-pulse">
            <div className="h-24" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total de Ordens', value: k.total_ordens, icon: '📦' },
    { label: 'Total de Amostras', value: k.total_amostras, icon: '🧬' },
    { label: 'Clientes Ativos', value: k.total_clientes, icon: '👥' },
    { label: 'Em Processamento', value: k.em_processamento, icon: '⚙️' },
    { label: 'A Faturar', value: k.a_faturar, icon: '💼' },
    { label: 'Concluídas Hoje', value: k.concluidas_hoje, icon: '✅' },
    { label: 'Alta Prioridade', value: k.alta_prioridade, icon: '🚨' },
    { label: 'Reagendadas', value: k.reagendamentos, icon: '🔁' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 bg-zenith-card border border-zenith-navy/30 text-center hover:border-zenith-gold/60 transition-all"
        >
          <div className="text-3xl mb-1">{c.icon}</div>
          <div className="text-zenith-gold text-sm">{c.label}</div>
          <div className="inline-flex items-center justify-center px-3 py-1 mt-1 rounded-lg bg-white/90 text-2xl font-semibold text-black">
            {c.value ?? '-'}
          </div>
        </div>
      ))}
    </div>
  );
}
