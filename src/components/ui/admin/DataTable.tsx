"use client";

import type { ReactNode } from "react";
import { SearchIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { SkeletonRow } from "@/components/ui/admin/Skeleton";
import type { useDataTable } from "@/components/ui/admin/useDataTable";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortField?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  keyField,
  table,
  loading = false,
  emptyMessage = "No hay resultados.",
  searchPlaceholder = "Buscar...",
  renderActions,
  toolbarExtra,
  headerAction,
}: {
  columns: DataTableColumn<T>[];
  keyField: keyof T;
  table: ReturnType<typeof useDataTable<T>>;
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  renderActions?: (row: T) => ReactNode;
  toolbarExtra?: ReactNode;
  headerAction?: ReactNode;
}) {
  const { search, setSearch, sort, toggleSort, page, pageCount, setPage, pagedData, resultCount } = table;

  return (
    <div className="overflow-hidden rounded-admin-xl border border-admin-border bg-admin-surface shadow-admin-xs">
      <div className="flex flex-col gap-3 border-b border-admin-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-admin-md border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm text-admin-text placeholder:text-admin-text-muted/60 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
            />
          </div>
          {toolbarExtra}
        </div>
        {headerAction}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-admin-bg text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
            <tr>
              {columns.map((col) => {
                const field = col.sortField ?? (col.key as keyof T);
                const isSorted = sort?.field === field;
                return (
                  <th key={col.key} className={`px-5 py-3 ${col.className ?? ""}`}>
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(field)}
                        className="flex items-center gap-1 transition-colors hover:text-admin-text"
                      >
                        {col.header}
                        {isSorted &&
                          (sort!.direction === "asc" ? (
                            <ChevronUpIcon className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                          ))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {renderActions && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length + (renderActions ? 1 : 0)} />
              ))
            ) : pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="px-5 py-10 text-center text-sm font-medium text-admin-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row) => (
                <tr key={String(row[keyField])} className="transition-colors hover:bg-admin-bg">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-3.5 text-admin-text ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">{renderActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-admin-border px-5 py-3 text-sm text-admin-text-muted">
          <span>
            {resultCount} resultado{resultCount === 1 ? "" : "s"} · página {page} de {pageCount}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-admin-bg disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-admin-bg disabled:opacity-30"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
