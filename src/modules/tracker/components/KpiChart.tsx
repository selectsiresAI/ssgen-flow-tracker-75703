import { useEffect, useState } from 'react';

interface KpiChartProps {
  data: Array<{
    mes: string;
    ordens: number;
    amostras: number;
  }>;
}

export function KpiChart({ data }: KpiChartProps) {
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
      <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
        <div className="text-zenith-gold mb-2">Evolução de Ordens e Amostras</div>
        <div className="h-[250px] flex items-center justify-center text-zenith-gray">
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
    Legend,
  } = RC as any;

  if (!data || data.length === 0) {
    return (
      <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
        <div className="text-zenith-gold mb-2">Evolução de Ordens e Amostras</div>
        <div className="h-64 flex items-center justify-center text-zenith-gray">
          Sem dados disponíveis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-2 font-semibold">Evolução de Ordens e Amostras</div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorOrdens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#C6A053" stopOpacity={0.8}/>
              <stop offset="90%" stopColor="#C6A053" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAmostras" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#8DC63F" stopOpacity={0.6}/>
              <stop offset="90%" stopColor="#8DC63F" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="mes" stroke="#BBC3CF" style={{ fontSize: '12px' }} />
          <YAxis stroke="#BBC3CF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F1419',
              border: '1px solid #1F2937',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ color: '#BBC3CF' }} />
          <Area 
            type="monotone" 
            dataKey="ordens" 
            stroke="#C6A053" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorOrdens)" 
            name="Ordens"
          />
          <Area 
            type="monotone" 
            dataKey="amostras" 
            stroke="#8DC63F" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAmostras)" 
            name="Amostras"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
