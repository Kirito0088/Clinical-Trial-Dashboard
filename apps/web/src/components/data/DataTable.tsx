import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  /** Shows the search box and filters client-side across every column. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Adds a "Download CSV" button that exports the current filtered rows. */
  exportable?: boolean;
  exportFilename?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
}

/**
 * The table every list screen uses.
 *
 * Sorting, filtering and pagination run client-side. That is the right call at
 * demo scale (hundreds to a few thousand rows) because it removes a whole class
 * of server round-trips from the sprint, and it means a table over a freshly
 * dropped CSV behaves identically to one over an API resource.
 *
 * If a statement genuinely needs server-side paging, the API's list endpoints
 * already return `meta`, so swap `getPaginationRowModel` for a manual mode.
 */
export function DataTable<T>({
  data,
  columns,
  loading,
  searchable = true,
  searchPlaceholder = 'Search…',
  exportable = true,
  exportFilename = 'export.csv',
  pageSize = 15,
  onRowClick,
  empty,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;

  const exportCsv = useMemo(
    () => () => {
      const visible = table.getVisibleLeafColumns();
      const header = visible.map((c) => c.id);
      const body = table.getFilteredRowModel().rows.map((row) =>
        visible.map((c) => csvCell(row.getValue(c.id))),
      );
      const csv = [header.join(','), ...body.map((r) => r.join(','))].join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [table, exportFilename],
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(searchable || exportable) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-48 flex-1 max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
                aria-label="Search table"
              />
            </div>
          )}
          <span className="font-mono text-[11px] text-[var(--muted)] tnum">
            {totalFiltered} {totalFiltered === 1 ? 'row' : 'rows'}
          </span>
          {exportable && totalFiltered > 0 && (
            <Button variant="secondary" size="sm" onClick={exportCsv} className="ml-auto">
              <Download />
              CSV
            </Button>
          )}
        </div>
      )}

      {/* Wide tables scroll inside this container, never the page body. */}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[var(--bg)]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2.5 text-left font-mono text-[10px] font-500 uppercase tracking-wider text-[var(--muted)]"
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-[var(--fg)]"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === 'asc' ? (
                            <ArrowUp className="size-3" />
                          ) : dir === 'desc' ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-[var(--muted)]">
                  {empty ?? 'Nothing to show yet.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'border-t border-[var(--border)]',
                    onRowClick && 'cursor-pointer hover:bg-[var(--bg)]',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-[var(--muted)] tnum">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Quote a value for CSV, escaping embedded quotes. */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
