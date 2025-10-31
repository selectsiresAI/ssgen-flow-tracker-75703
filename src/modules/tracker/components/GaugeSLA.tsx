import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';

export function GaugeSLA({ value = 0, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const data = [{ name: 'SLA', value: pct }];
  
  return (
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-2 text-sm">{label}</div>
      <div className="flex items-center justify-center">
        <RadialBarChart width={180} height={140} innerRadius="80%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" fill="#C6A053" />
        </RadialBarChart>
      </div>
      <div className="text-center -mt-6 text-xl font-semibold text-white">{pct.toFixed(1)}%</div>
    </div>
  );
}
