import { useCallback, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState<K extends PropertyKey> {
  sortColumn: K | null;
  sortDirection: SortDirection;
}

export interface UseSortTableOptions<T, K extends keyof T = keyof T> {
  data: T[];
  initialSortColumn?: K | null;
  initialSortDirection?: SortDirection;
  sortColumn?: K | null;
  sortDirection?: SortDirection;
  onSortChange?: (column: K | null, direction: SortDirection) => void;
  nonSortableColumns?: K[];
  customSorters?: Partial<Record<K, (a: T, b: T) => number>>;
}

export interface UseSortTableResult<T, K extends keyof T = keyof T> {
  sortedData: T[];
  sortColumn: K | null;
  sortDirection: SortDirection;
  handleSort: (column: K, direction?: SortDirection) => void;
  setSortState: (column: K | null, direction: SortDirection) => void;
}

const collator = new Intl.Collator('pt-BR', {
  numeric: true,
  sensitivity: 'base',
  usage: 'sort',
});

function comparePrimitive(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return -1;
  if (bEmpty) return 1;

  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return 0;
    if (Number.isNaN(a)) return -1;
    if (Number.isNaN(b)) return 1;
    return a - b;
  }

  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return a === b ? 0 : a > b ? 1 : -1;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return collator.compare(a, b);
  }

  if (typeof a === 'number' && typeof b === 'string') {
    return comparePrimitive(String(a), b);
  }

  if (typeof a === 'string' && typeof b === 'number') {
    return comparePrimitive(a, String(b));
  }

  return collator.compare(String(a), String(b));
}

export function useSortTable<T, K extends keyof T = keyof T>(
  options: UseSortTableOptions<T, K>,
): UseSortTableResult<T, K> {
  const {
    data,
    initialSortColumn = null,
    initialSortDirection,
    sortColumn: controlledSortColumn,
    sortDirection: controlledSortDirection,
    onSortChange,
    nonSortableColumns = [],
    customSorters,
  } = options;

  const [internalSortColumn, setInternalSortColumn] = useState<K | null>(initialSortColumn);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(() => {
    if (initialSortDirection !== undefined) {
      return initialSortDirection;
    }

    if (initialSortColumn) {
      return 'asc';
    }

    return null;
  });

  const isControlled =
    controlledSortColumn !== undefined && controlledSortDirection !== undefined;

  const sortColumn = (isControlled ? controlledSortColumn : internalSortColumn) ?? null;
  const sortDirection = (isControlled ? controlledSortDirection : internalSortDirection) ?? null;

  const nonSortableSet = useMemo(() => new Set(nonSortableColumns), [nonSortableColumns]);

  const setSortState = useCallback(
    (column: K | null, direction: SortDirection) => {
      const nextColumn = direction ? column : null;
      const nextDirection = direction;

      if (!isControlled) {
        setInternalSortColumn(nextColumn);
        setInternalSortDirection(nextDirection);
      }

      onSortChange?.(nextColumn, nextDirection);
    },
    [isControlled, onSortChange],
  );

  const handleSort = useCallback(
    (column: K, direction?: SortDirection) => {
      if (nonSortableSet.has(column)) {
        return;
      }

      const isSameColumn = sortColumn === column;
      const nextDirection =
        direction !== undefined
          ? direction
          : isSameColumn
            ? sortDirection === 'asc'
              ? 'desc'
              : sortDirection === 'desc'
                ? null
                : 'asc'
            : 'asc';

      setSortState(nextDirection ? column : null, nextDirection);
    },
    [nonSortableSet, setSortState, sortColumn, sortDirection],
  );

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return data;
    }

    const sorter = customSorters?.[sortColumn];
    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    return [...data]
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        if (sorter) {
          const customResult = sorter(a.item, b.item);
          if (customResult !== 0) {
            return customResult * directionMultiplier;
          }
        }

        const aValue = a.item[sortColumn];
        const bValue = b.item[sortColumn];
        const result = comparePrimitive(aValue, bValue);

        if (result !== 0) {
          return result * directionMultiplier;
        }

        return a.index - b.index;
      })
      .map(({ item }) => item);
  }, [customSorters, data, sortColumn, sortDirection]);

  return {
    sortedData,
    sortColumn,
    sortDirection,
    handleSort,
    setSortState,
  };
}

