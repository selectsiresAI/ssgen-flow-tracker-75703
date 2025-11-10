import { useEffect, useState } from 'react';

export function GaugeSLA({ value = 0, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const data = [{ name: 'SLA', value: pct }];

  const [RC, setRC] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    import('recharts')
      .then((mod) => {
        if (mounted) setRC(mod);
      })
      .catch((err) => console.error('Failed to load recharts:', err));

    return () => {
      mounted = false;
    };
  }, []);

  if (!RC) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="text-black mb-2 text-sm">{label}</div>
        <div className="h-[140px] flex items-center justify-center text-black">Carregando gráfico...</div>
      </div>
    );
  }

  const { RadialBar, RadialBarChart, PolarAngleAxis } = RC as any;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      <div className="text-black mb-2 text-sm">{label}</div>
      <div className="flex items-center justify-center">
        <RadialBarChart width={180} height={140} innerRadius="80%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" fill="#C6A053" />
        </RadialBarChart>
      </div>
      <div className="flex justify-center -mt-6">
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-gray-100 text-xl font-semibold text-black">
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
