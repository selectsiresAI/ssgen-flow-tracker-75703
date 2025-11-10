import * as React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { TableHead } from './table';
import type { SortDirection } from '@/hooks/useSortTable';

export interface SortableHeaderProps<K extends PropertyKey>
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  label: React.ReactNode;
  columnKey?: K;
  sortColumn: K | null;
  sortDirection: SortDirection;
  onSort: (column: K, direction?: SortDirection) => void;
  sortable?: boolean;
}

export const SortableHeader = <K extends PropertyKey>({
  label,
  columnKey,
  sortColumn,
  sortDirection,
  onSort,
  sortable = true,
  className,
  ...rest
}: SortableHeaderProps<K>) => {
  const isSortable = sortable && columnKey !== undefined;
  const isActive = isSortable && columnKey === sortColumn && sortDirection !== null;
  const Icon = sortDirection === 'asc' ? ArrowUp : ArrowDown;
  const ariaSort: React.AriaAttributes['aria-sort'] = isActive
    ? sortDirection === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

  const handleClick = React.useCallback(() => {
    if (!isSortable || columnKey === undefined) return;

    const nextDirection: SortDirection = isActive
      ? sortDirection === 'asc'
        ? 'desc'
        : null
      : 'asc';

    onSort(columnKey, nextDirection);
  }, [columnKey, isActive, isSortable, onSort, sortDirection]);

  if (!isSortable) {
    return (
      <TableHead className={cn('select-none', className)} {...rest}>
        <span>{label}</span>
      </TableHead>
    );
  }

  return (
    <TableHead
      role="columnheader"
      aria-sort={ariaSort}
      className={cn('select-none', className)}
      {...rest}
    >
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left"
        onClick={handleClick}
      >
        <span className="flex-1 truncate">{label}</span>
        {isActive && sortDirection !== null ? (
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-0" aria-hidden />
        )}
      </button>
    </TableHead>
  );
};

SortableHeader.displayName = 'SortableHeader';

