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
          <div key={i} className="rounded-lg p-4 bg-card border animate-pulse">
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
      color: 'text-green-600',
    },
    {
      label: 'Ordens Faturadas',
      value: summary.total_ordens_faturadas,
      icon: <FileText className="w-5 h-5" />,
      color: 'text-blue-600',
    },
    {
      label: 'Amostras Faturadas',
      value: summary.total_amostras_faturadas,
      icon: <Package className="w-5 h-5" />,
      color: 'text-purple-600',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${summary.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg p-6 bg-card border hover:border-primary/50 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`${card.color}`}>{card.icon}</div>
          </div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
            {card.label}
          </div>
          <div className="text-3xl font-bold text-foreground">{card.value}</div>
        </div>
      ))}
      
      <div className="col-span-2 md:col-span-2 rounded-lg p-6 bg-card border border-primary/30">
        <div className="text-primary text-xs uppercase tracking-wide mb-2">
          Mês Atual
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Faturamento</div>
            <div className="text-2xl font-bold text-foreground">
              R$ {summary.faturamento_mes_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Ordens</div>
            <div className="text-2xl font-bold text-foreground">
              {summary.ordens_mes_atual}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
