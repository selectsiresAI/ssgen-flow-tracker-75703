import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UnifiedOrder } from '@/types/ssgen';

interface StageConfig {
  name: string;
  dateField: keyof UnifiedOrder;
  slaField?: keyof UnifiedOrder;
  maxDays?: number;
}

const STAGES: StageConfig[] = [
  { name: 'CRA', dateField: 'cra_data', maxDays: 2 },
  { name: 'Envio Planilha', dateField: 'envio_planilha_data', slaField: 'envio_planilha_status_sla', maxDays: 3 },
  { name: 'VRI', dateField: 'vri_data', slaField: 'vri_status_sla', maxDays: 2 },
  { name: 'LPR', dateField: 'lpr_data', slaField: 'lpr_status_sla', maxDays: 5 },
  { name: 'Envio Resultados', dateField: 'envio_resultados_data', slaField: 'envio_resultados_status_sla', maxDays: 3 },
  { name: 'Receb. Resultados', dateField: 'dt_receb_resultados', maxDays: 1 },
  { name: 'Faturamento', dateField: 'dt_faturamento', maxDays: 2 },
];

interface StageFlowTableProps {
  order: UnifiedOrder;
}

const calculateDaysBetween = (date1?: string | null, date2?: string | null): number | null => {
  if (!date1 || !date2) return null;
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

const formatDate = (date?: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
};

export const StageFlowTable: React.FC<StageFlowTableProps> = ({ order }) => {
  const stageAnalysis = useMemo(() => {
    return STAGES.map((stage, index) => {
      const currentDate = order[stage.dateField] as string | null | undefined;
      const previousDate = index > 0 ? (order[STAGES[index - 1].dateField] as string | null | undefined) : order.data_cadastro;
      
      const daysBetween = calculateDaysBetween(previousDate, currentDate);
      const isOverdue = daysBetween !== null && stage.maxDays !== undefined && daysBetween > stage.maxDays;
      const slaStatus = stage.slaField ? (order[stage.slaField] as string | null | undefined) : null;
      
      return {
        ...stage,
        currentDate,
        previousDate,
        daysBetween,
        isOverdue,
        slaStatus,
      };
    });
  }, [order]);

  return (
    <div className="w-full">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left border">Etapa</th>
            <th className="p-2 text-left border">Data</th>
            <th className="p-2 text-left border">Dias desde anterior</th>
            <th className="p-2 text-left border">SLA</th>
            <th className="p-2 text-left border">Status</th>
          </tr>
        </thead>
        <tbody>
          {stageAnalysis.map((stage, index) => (
            <tr key={index} className={stage.isOverdue ? 'bg-destructive/10' : ''}>
              <td className="p-2 border font-medium">{stage.name}</td>
              <td className="p-2 border">{formatDate(stage.currentDate)}</td>
              <td className="p-2 border">
                {stage.daysBetween !== null ? (
                  <div className="flex items-center gap-2">
                    <span>{stage.daysBetween} dias</span>
                    {stage.isOverdue && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excedeu o SLA de {stage.maxDays} dias</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="p-2 border">
                {stage.maxDays ? `${stage.maxDays} dias` : '—'}
              </td>
              <td className="p-2 border">
                {stage.slaStatus ? (
                  <Badge 
                    variant={
                      stage.slaStatus === 'no_prazo' ? 'success' : 
                      stage.slaStatus === 'dia_zero' ? 'warning' : 
                      'destructive'
                    }
                  >
                    {stage.slaStatus === 'no_prazo' ? 'No Prazo' : 
                     stage.slaStatus === 'dia_zero' ? 'Dia Zero' : 
                     'Atrasado'}
                  </Badge>
                ) : stage.currentDate ? (
                  <Badge variant="secondary">Concluído</Badge>
                ) : (
                  <Badge variant="outline">Pendente</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
