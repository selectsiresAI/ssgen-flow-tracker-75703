import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PowerRow } from '@/types/ssgen';
import { isSet, fmt, slaBadge } from '@/types/ssgen';

interface TableOrdensProps {
  rows: PowerRow[];
  allowEdit: boolean;
  allowAttach: boolean;
  allowFinance: boolean;
  onOpen: (r: PowerRow) => void;
}

export const TableOrdens: React.FC<TableOrdensProps> = ({
  rows,
  allowEdit,
  allowAttach,
  allowFinance,
  onOpen,
}) => {
  const firstColumnWidth = '10rem';
  const firstColumnHorizontalPadding = '1.5rem';
  const secondColumnOffset = `calc(${firstColumnWidth} + ${firstColumnHorizontalPadding})`;

  const stickySecondColumnStyle: React.CSSProperties = { left: secondColumnOffset };

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-[1200px] text-sm">
        <thead className="bg-muted/40 sticky top-0 z-20">
          <tr className="text-left">
            <th
              className={cn(
                'sticky left-0 top-0 z-40 bg-muted/40',
                'whitespace-nowrap p-3',
                'w-40'
              )}
            >
              OS_SSGEN
            </th>
            <th
              className={cn(
                'sticky top-0 z-30 bg-muted/40',
                'whitespace-nowrap p-3',
                'w-60'
              )}
              style={stickySecondColumnStyle}
            >
              Nome do cliente
            </th>
          {[
            'COORD',
            'REP',
            'PROD_SSG',
            'N_AMOSTRAS_SSG',
            'DT_SSGEN_OS',
            'DT_PREV_RESULT_SSG',
            'RESULT_SSG',
            'DT_RESULT_SSG',
            'FATUR_TIPO',
            'FATUR_SSG',
            'DT_FATUR_SSG',
            'OS_NEOGEN',
            'DT_CRA',
            'PLAN_NEOGEN',
            'DT_PLAN_NEOGEN',
            'N_VRI',
            'DT_VRI',
            'N_LPR',
            'DT_LPR',
            'N_LR',
            'DT_LR',
            'LR_RASTREIO',
            'NF_NEOGEM',
            'SLA',
          ].map((h) => (
            <th key={h} className="p-3 whitespace-nowrap">
              {h}
            </th>
          ))}
          <th className="p-3">Ações</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const sla = slaBadge(r);
          const clientName = (r as PowerRow & { client_name?: string | null }).client_name;
          const resolvedClientName = clientName ?? r.CLIENTE ?? '—';

          return (
            <tr key={r.OS_SSGEN + '-' + i} className="group border-t hover:bg-muted/30">
              <td
                className={cn(
                  'sticky left-0 z-30 bg-background',
                  'w-40 p-3 font-medium text-primary',
                  'cursor-pointer transition-colors group-hover:bg-muted/30'
                )}
                onClick={() => onOpen(r)}
              >
                {r.OS_SSGEN}
              </td>
              <td
                className={cn(
                  'sticky z-20 bg-background',
                  'w-60 p-3 transition-colors group-hover:bg-muted/30'
                )}
                style={stickySecondColumnStyle}
              >
                {resolvedClientName}
              </td>
              <td className="p-3">{r.COORD}</td>
              <td className="p-3">{r.REP}</td>
              <td className="p-3">{r.PROD_SSG || '—'}</td>
              <td className="p-3">{isSet(r.N_AMOSTRAS_SSG) ? r.N_AMOSTRAS_SSG : '—'}</td>
              <td className="p-3">{fmt(r.DT_SSGEN_OS)}</td>
              <td className="p-3">{fmt(r.DT_PREV_RESULT_SSG)}</td>
              <td className="p-3">{r.RESULT_SSG || '—'}</td>
              <td className="p-3">{fmt(r.DT_RESULT_SSG)}</td>
              <td className="p-3">{r.FATUR_TIPO || '—'}</td>
              <td className="p-3">{isSet(r.FATUR_SSG) ? String(r.FATUR_SSG) : '—'}</td>
              <td className="p-3">{fmt(r.DT_FATUR_SSG)}</td>
              <td className="p-3">{r.OS_NEOGEN || '—'}</td>
              <td className="p-3">{fmt(r.DT_CRA)}</td>
              <td className="p-3">{r.PLAN_NEOGEN || '—'}</td>
              <td className="p-3">{fmt(r.DT_PLAN_NEOGEN)}</td>
              <td className="p-3">{isSet(r.N_VRI) ? r.N_VRI : '—'}</td>
              <td className="p-3">{fmt(r.DT_VRI)}</td>
              <td className="p-3">{isSet(r.N_LPR) ? r.N_LPR : '—'}</td>
              <td className="p-3">{fmt(r.DT_LPR)}</td>
              <td className="p-3">{isSet(r.N_LR) ? r.N_LR : '—'}</td>
              <td className="p-3">{fmt(r.DT_LR)}</td>
              <td className="p-3">{r.LR_RASTREIO || '—'}</td>
              <td className="p-3">{r.NF_NEOGEM || '—'}</td>
              <td className="p-3">
                <Badge variant={sla.tone as any}>{sla.label}</Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onOpen(r)}>
                    Detalhes
                  </Button>
                  {allowEdit && (
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  )}
                  {allowAttach && (
                    <Button size="sm" variant="outline">
                      Anexar
                    </Button>
                  )}
                  {allowFinance && (
                    <Button size="sm" variant="outline">
                      Faturar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
  );
};
