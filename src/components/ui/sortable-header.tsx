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
  onClick,
  onKeyDown,
  tabIndex,
  ...rest
}: SortableHeaderProps<K>) => {
  const isSortable = sortable && columnKey !== undefined;
  const activeDirection: SortDirection =
    isSortable && columnKey === sortColumn ? sortDirection : null;
  const isActive = activeDirection !== null;
  const Icon = activeDirection === 'desc' ? ArrowDown : ArrowUp;
  const ariaSort: React.AriaAttributes['aria-sort'] = isActive
    ? activeDirection === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

  const cycleDirection = React.useCallback((direction: SortDirection): SortDirection => {
    if (direction === 'asc') return 'desc';
    if (direction === 'desc') return null;
    return 'asc';
  }, []);

  const handleToggle = React.useCallback(() => {
    if (!isSortable || columnKey === undefined) return;

    const nextDirection = cycleDirection(activeDirection);
    onSort(columnKey, nextDirection);
  }, [activeDirection, columnKey, cycleDirection, isSortable, onSort]);

  const handleClick = React.useCallback<React.MouseEventHandler<HTMLTableCellElement>>(
    (event) => {
      if (isSortable) {
        handleToggle();
      }

      onClick?.(event);
    },
    [handleToggle, isSortable, onClick],
  );

  const handleKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLTableCellElement>>(
    (event) => {
      if (isSortable && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        handleToggle();
      }

      onKeyDown?.(event);
    },
    [handleToggle, isSortable, onKeyDown],
  );

  return (
    <TableHead
      role="columnheader"
      aria-sort={ariaSort}
      tabIndex={isSortable ? 0 : tabIndex}
      className={cn(
        'select-none',
        isSortable && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className="flex w-full items-center gap-1 text-left">
        <span className="flex-1 truncate">{label}</span>
        {isActive ? (
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-0" aria-hidden />
        )}
      </div>
    </TableHead>
  );
};

SortableHeader.displayName = 'SortableHeader';

