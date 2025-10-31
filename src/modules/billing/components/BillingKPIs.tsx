import { DollarSign, FileText, Package, TrendingUp } from 'lucide-react';
import type { BillingSummary } from '@/lib/billingApi';

interface BillingKPIsProps {
  summary: BillingSummary | null;
}

export function BillingKPIs({ summary }: BillingKPIsProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl p-4 bg-zenith-card border border-zenith-navy/30 animate-pulse">
            <div className="h-20" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Faturamento Total',
      value: `R$ ${summary.valor_total_faturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-success',
    },
    {
      label: 'Ordens Faturadas',
      value: summary.total_ordens_faturadas,
      icon: <FileText className="w-5 h-5" />,
      color: 'text-zenith-gold',
    },
    {
      label: 'Amostras Faturadas',
      value: summary.total_amostras_faturadas,
      icon: <Package className="w-5 h-5" />,
      color: 'text-primary',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${summary.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-2xl p-6 bg-zenith-card border border-zenith-navy/30 hover:border-zenith-gold/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`${card.color}`}>{card.icon}</div>
          </div>
          <div className="text-zenith-gold text-xs uppercase tracking-wide mb-1">
            {card.label}
          </div>
          <div className="text-3xl font-bold text-white">{card.value}</div>
        </div>
      ))}
      
      <div className="col-span-2 md:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-zenith-card to-zenith-navy/30 border border-zenith-gold/30">
        <div className="text-zenith-gold text-xs uppercase tracking-wide mb-2">
          Mês Atual
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-zenith-gray mb-1">Faturamento</div>
            <div className="text-2xl font-bold text-white">
              R$ {summary.faturamento_mes_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-zenith-gray mb-1">Ordens</div>
            <div className="text-2xl font-bold text-white">
              {summary.ordens_mes_atual}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
