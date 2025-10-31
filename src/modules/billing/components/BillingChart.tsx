import { useEffect, useState } from 'react';
import type { BillingMonthly } from '@/lib/billingApi';

interface BillingChartProps {
  data: BillingMonthly[];
}

export function BillingChart({ data }: BillingChartProps) {
  const [RC, setRC] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then(mod => {
        if (mounted) setRC(mod);
      })
      .catch(err => console.error("Failed to load recharts:", err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!RC) {
    return (
      <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
        <div className="text-zenith-gold mb-4 font-semibold">Evolução de Faturamento (12 meses)</div>
        <div className="h-[300px] flex items-center justify-center text-zenith-gray">
          Carregando gráfico...
        </div>
      </div>
    );
  }
  const {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
  } = RC as any;

  if (!data || data.length === 0) {
    return (
      <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
        <div className="text-zenith-gold mb-4 font-semibold">Evolução de Faturamento</div>
        <div className="h-64 flex items-center justify-center text-zenith-gray">
          Sem dados disponíveis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-4 font-semibold">Evolução de Faturamento (12 meses)</div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#C6A053" stopOpacity={0.8}/>
              <stop offset="90%" stopColor="#C6A053" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis 
            dataKey="mes_label" 
            stroke="#BBC3CF" 
            tick={{ fill: '#BBC3CF' }}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#BBC3CF" 
            tick={{ fill: '#BBC3CF' }}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F1419',
              border: '1px solid #1F2937',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
          />
          <Area 
            type="monotone" 
            dataKey="valor_faturado" 
            stroke="#C6A053" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorFaturamento)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
