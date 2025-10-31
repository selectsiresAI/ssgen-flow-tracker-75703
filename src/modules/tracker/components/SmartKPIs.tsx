import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import type { TrackerKPI } from '@/types/ssgen';

interface SmartKPIsProps {
  kpis: TrackerKPI;
  trends?: {
    total_os_trend?: number;
    em_processamento_trend?: number;
    sla_trend?: number;
  };
}

export function SmartKPIs({ kpis, trends }: SmartKPIsProps) {
  const slaAverage = (
    (kpis.pct_sla_envio_ok || 0) +
    (kpis.pct_sla_vri_ok || 0) +
    (kpis.pct_sla_lpr_ok || 0) +
    (kpis.pct_sla_envio_res_ok || 0)
  ) / 4;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <KPICard 
        title="Total OS" 
        value={kpis.total_os} 
        trend={trends?.total_os_trend}
        icon={<CheckCircle className="w-4 h-4" />}
      />
      <KPICard 
        title="Em Processamento" 
        value={kpis.em_processamento}
        trend={trends?.em_processamento_trend}
        subtitle={`${((kpis.em_processamento / kpis.total_os) * 100).toFixed(0)}% do total`}
      />
      <KPICard 
        title="A Faturar" 
        value={kpis.a_faturar}
        subtitle={`${((kpis.a_faturar / kpis.total_os) * 100).toFixed(0)}% do total`}
      />
      <KPICard 
        title="Concluídas Hoje" 
        value={kpis.concluidas_hoje}
        icon={<CheckCircle className="w-4 h-4 text-success" />}
      />
      <KPICard 
        title="TMA (dias)" 
        value={kpis.tma_dias?.toFixed(1) ?? '—'}
        subtitle="Tempo médio"
      />
      
      <KPICard 
        title="SLA Médio" 
        value={`${slaAverage.toFixed(1)}%`}
        trend={trends?.sla_trend}
        status={slaAverage >= 90 ? 'success' : slaAverage >= 70 ? 'warning' : 'error'}
      />
      <KPICard 
        title="Alta Prioridade" 
        value={kpis.alta_prioridade || 0}
        icon={<AlertTriangle className="w-4 h-4 text-warning" />}
      />
      <KPICard 
        title="Reagendamentos" 
        value={kpis.reagendamentos || 0}
        status={kpis.reagendamentos > 5 ? 'warning' : undefined}
      />
      <KPICard 
        title="SLA VRI Atrasado" 
        value={kpis.sla_vri_atrasado || 0}
        status={kpis.sla_vri_atrasado > 0 ? 'error' : 'success'}
      />
      <KPICard 
        title="SLA LPR Atrasado" 
        value={kpis.sla_lpr_atrasado || 0}
        status={kpis.sla_lpr_atrasado > 0 ? 'error' : 'success'}
      />
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: any;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error';
}

function KPICard({ title, value, subtitle, trend, icon, status }: KPICardProps) {
  const statusColors = {
    success: 'border-l-success',
    warning: 'border-l-warning',
    error: 'border-l-destructive',
  };

  return (
    <div className={`rounded-2xl p-4 bg-zenith-card border border-zenith-navy/30 border-l-4 ${status ? statusColors[status] : 'border-l-zenith-gold'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-zenith-gold text-xs uppercase tracking-wide">{title}</div>
        {icon && <div className="text-zenith-gold">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white">{value}</div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      {subtitle && <div className="text-xs text-zenith-gray mt-1">{subtitle}</div>}
    </div>
  );
}
