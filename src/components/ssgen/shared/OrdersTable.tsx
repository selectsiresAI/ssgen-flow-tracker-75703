import React, { useMemo } from 'react';

import { useSortTable } from '@/hooks/useSortTable';
import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SortableHeader } from '@/components/ui/sortable-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PowerRow } from '@/types/ssgen';
import { fmt, isSet, slaBadge } from '@/types/ssgen';

interface TableOrdensProps {
  rows: PowerRow[];
  allowEdit: boolean;
  allowAttach: boolean;
  allowFinance: boolean;
  onOpen: (r: PowerRow) => void;
}

interface ColumnDefinition<T> {
  id: string;
  label: string;
  sortKey?: keyof T;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
}

const getPriorityVariant = (prioridade?: string | null): BadgeProps['variant'] => {
  switch (prioridade) {
    case 'alta':
      return 'destructive';
    case 'media':
      return 'warning';
    case 'baixa':
      return 'secondary';
    default:
      return 'outline';
  }
};

const renderFallback = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return value;
};

export const TableOrdens: React.FC<TableOrdensProps> = ({
  rows,
  allowEdit,
  allowAttach,
  allowFinance,
  onOpen,
}) => {
  const columns = useMemo<ColumnDefinition<PowerRow>[]>(
    () => [
      {
        id: 'os-ssgen',
        label: 'OS SSGEN',
        sortKey: 'OS_SSGEN',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'text-primary font-medium',
        render: (row) => (
          <button
            type="button"
            onClick={() => onOpen(row)}
            className="transition-colors hover:text-primary/80"
          >
            {row.OS_SSGEN}
          </button>
        ),
      },
      {
        id: 'cliente',
        label: 'Nome do cliente',
        sortKey: 'CLIENTE',
        cellClassName: 'whitespace-nowrap',
        render: (row) => renderFallback(row.CLIENTE),
      },
      {
        id: 'coordenador',
        label: 'Coordenador',
        sortKey: 'COORD',
        cellClassName: 'whitespace-nowrap',
        render: (row) => renderFallback(row.COORD),
      },
      {
        id: 'representante',
        label: 'Representante',
        sortKey: 'REP',
        cellClassName: 'whitespace-nowrap',
        render: (row) => renderFallback(row.REP),
      },
      {
        id: 'produto',
        label: 'Produto',
        sortKey: 'PROD_SSG',
        render: (row) => renderFallback(row.PROD_SSG),
      },
      {
        id: 'numero-amostras',
        label: 'Nº Amostras',
        sortKey: 'N_AMOSTRAS_SSG',
        render: (row) => (isSet(row.N_AMOSTRAS_SSG) ? row.N_AMOSTRAS_SSG : '—'),
      },
      {
        id: 'etapa',
        label: 'Etapa',
        sortKey: 'PLAN_NEOGEN',
        render: (row) => renderFallback(row.PLAN_NEOGEN),
      },
      {
        id: 'cra',
        label: 'CRA',
        sortKey: 'DT_CRA',
        render: (row) => fmt(row.DT_CRA),
      },
      {
        id: 'envio-planilha',
        label: 'Envio de Planilha',
        sortKey: 'DT_PLAN_NEOGEN',
        render: (row) => fmt(row.DT_PLAN_NEOGEN),
      },
      {
        id: 'vri',
        label: 'VRI',
        sortKey: 'DT_VRI',
        render: (row) => fmt(row.DT_VRI),
      },
      {
        id: 'lpr',
        label: 'LPR',
        sortKey: 'DT_LPR',
        render: (row) => fmt(row.DT_LPR),
      },
      {
        id: 'lr',
        label: 'LR',
        sortKey: 'DT_LR',
        render: (row) => fmt(row.DT_LR),
      },
      {
        id: 'envio-resultados',
        label: 'Envio de Resultados',
        sortKey: 'DT_RESULT_SSG',
        render: (row) => fmt(row.DT_RESULT_SSG),
      },
      {
        id: 'faturar',
        label: 'Faturar',
        sortKey: 'FATUR_TIPO',
        render: (row) => renderFallback(row.FATUR_TIPO),
      },
      {
        id: 'prioridade',
        label: 'Prioridade',
        sortKey: 'prioridade',
        render: (row) =>
          row.prioridade ? (
            <Badge variant={getPriorityVariant(row.prioridade)} className="capitalize">
              {row.prioridade}
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        id: 'aging',
        label: 'Aging',
        sortKey: 'DT_PREV_RESULT_SSG',
        render: (row) => {
          const badge = slaBadge(row);
          return <Badge variant={badge.tone as BadgeProps['variant']}>{badge.label}</Badge>;
        },
      },
      {
        id: 'status',
        label: 'Status',
        sortKey: 'RESULT_SSG',
        render: (row) => renderFallback(row.RESULT_SSG),
      },
    ],
    [onOpen],
  );

  const { sortedData, sortColumn, sortDirection, handleSort } = useSortTable<PowerRow>({
    data: rows,
  });

  return (
    <div className="rounded-xl border">
      <Table className="min-w-[1200px]">
        <TableHeader className="bg-muted/40">
          <TableRow>
            {columns.map((column) =>
              column.sortKey && column.sortable !== false ? (
                <SortableHeader<keyof PowerRow>
                  key={column.id}
                  columnKey={column.sortKey}
                  label={column.label}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className={cn('px-4 py-3', column.headerClassName)}
                />
              ) : (
                <TableHead key={column.id} className={cn('px-4 py-3', column.headerClassName)}>
                  {column.label}
                </TableHead>
              ),
            )}
            <TableHead className="px-4 py-3">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                Nenhuma ordem encontrada
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, index) => (
              <TableRow key={`${row.OS_SSGEN}-${index}`}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={cn('px-4 py-3 align-top', column.cellClassName)}>
                    {column.render(row)}
                  </TableCell>
                ))}
                <TableCell className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onOpen(row)}>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

