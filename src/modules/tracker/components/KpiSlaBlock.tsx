import { GaugeSLA } from './GaugeSLA';
import type { TrackerKPI } from '@/types/ssgen';

interface KpiSlaBlockProps {
  k?: TrackerKPI | null;
}

export function KpiSlaBlock({ k }: KpiSlaBlockProps) {
  if (!k) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl p-4 bg-white border border-gray-200 animate-pulse">
            <div className="h-40" />
          </div>
        ))}
      </div>
    );
  }

  const slaTotal = (
    (Number(k.pct_sla_envio_ok ?? 0) +
     Number(k.pct_sla_vri_ok ?? 0) +
     Number(k.pct_sla_lpr_ok ?? 0) +
     Number(k.pct_sla_envio_res_ok ?? 0)) / 4
  ).toFixed(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <GaugeSLA value={Number(k.pct_sla_envio_ok ?? 0)} label="SLA Envio Planilha" />
      <GaugeSLA value={Number(k.pct_sla_vri_ok ?? 0)} label="SLA VRI" />
      <GaugeSLA value={Number(k.pct_sla_lpr_ok ?? 0)} label="SLA LPR" />
      <GaugeSLA value={Number(k.pct_sla_envio_res_ok ?? 0)} label="SLA Envio Resultados" />
      <GaugeSLA value={Number(slaTotal)} label="SLA Total" />
    </div>
  );
}
