"use client";

import { useState } from "react";
import { SearchIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, KebabIcon } from "@/components/ui/Icons";
import { Skeleton } from "@/components/ui/admin/Skeleton";
import { EmptyState } from "@/components/ui/admin/EmptyState";
import { Popover } from "@/components/ui/admin/Popover";
import { formatSignedCOP } from "@/lib/format";
import { movementEffect, type BudgetMovement } from "@/data/finance";
import type { Advisor } from "@/data/advisors";
import type { useDataTable } from "@/components/ui/admin/useDataTable";

const SORT_FIELDS: { field: keyof BudgetMovement; label: string; align?: "right" }[] = [
  { field: "movement_date", label: "Fecha" },
  { field: "amount", label: "Valor", align: "right" },
];

export function TransactionList<T extends BudgetMovement>({
  table,
  advisors,
  loading,
  canEdit,
  showAdvisor = true,
  onEdit,
  onDelete,
  onExportExcel,
  onExportPdf,
  emptyState,
}: {
  table: ReturnType<typeof useDataTable<T>>;
  advisors: Advisor[];
  loading: boolean;
  canEdit: boolean;
  // Off inside a single member's view — every row would repeat the same
  // name. On for "Todos", where it's the one column that actually varies.
  showAdvisor?: boolean;
  onEdit: (m: T) => void;
  onDelete: (m: T) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  emptyState?: { title: string; description?: string; actionLabel?: string; onAction?: () => void };
}) {
  const { search, setSearch, sort, toggleSort, page, pageCount, setPage, pagedData, resultCount } = table;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const advisorName = (id: string) => advisors.find((a) => a.id === id)?.name ?? "—";
  const advisorColor = (id: string) => advisors.find((a) => a.id === id)?.color ?? "#0f3fb0";

  return (
    <div className="overflow-hidden rounded-admin-lg border border-admin-border bg-admin-surface shadow-admin-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-[13px] font-bold text-admin-text">Movimientos</h3>
          <span className="text-[11.5px] font-medium text-admin-text-muted">{resultCount} en total</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Exportar a Excel"
            title="Exportar a Excel"
            onClick={onExportExcel}
            className="flex h-7 w-7 items-center justify-center rounded-admin-sm text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Exportar a PDF"
            title="Exportar a PDF"
            onClick={onExportPdf}
            className="flex h-7 w-7 items-center justify-center rounded-admin-sm text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-admin-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-40 rounded-admin-sm border border-admin-border bg-admin-surface py-1.5 pl-8 pr-2.5 text-xs text-admin-text placeholder:text-admin-text-muted/60 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : pagedData.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={emptyState?.title ?? "Sin resultados."}
            description={emptyState?.description}
            actionLabel={emptyState?.actionLabel}
            onAction={emptyState?.onAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted">Concepto</th>
                {SORT_FIELDS.map((col) => {
                  const active = sort?.field === col.field;
                  return (
                    <th
                      key={col.field}
                      className={`whitespace-nowrap px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted ${col.align === "right" ? "text-right" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.field)}
                        className={`inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 ${active ? "text-admin-text" : "hover:text-admin-text"}`}
                      >
                        {col.label}
                        {active && (sort!.direction === "asc" ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />)}
                      </button>
                    </th>
                  );
                })}
                <th className="whitespace-nowrap px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted">Tipo</th>
                {showAdvisor && (
                  <th className="whitespace-nowrap px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted">Integrante</th>
                )}
                <th className="whitespace-nowrap px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted">Autor</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {pagedData.map((m) => {
                const effect = movementEffect(m);
                const positive = effect >= 0;
                return (
                  <tr key={m.id} className="group border-t border-admin-border transition-colors hover:bg-admin-bg/60">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-admin-text">{m.concept}</div>
                      {m.observations && <div className="text-[11px] text-admin-text-muted">{m.observations}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-admin-text-muted">
                      {new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      <span className="ml-1 text-[10.5px] text-admin-text-muted/70">
                        {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-2.5 text-right font-bold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatSignedCOP(effect)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                          positive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        }`}
                      >
                        {m.type === "ingreso" ? "Ingreso" : "Gasto"}
                      </span>
                    </td>
                    {showAdvisor && (
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                            style={{ backgroundColor: advisorColor(m.advisor_id) }}
                          >
                            {advisorName(m.advisor_id).slice(0, 1).toUpperCase()}
                          </span>
                          <span className="text-admin-text-muted">{advisorName(m.advisor_id)}</span>
                        </div>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-2.5 text-admin-text-muted">
                      {m.profiles?.full_name || m.profiles?.email || "—"}
                    </td>
                    <td className="px-2 py-2.5">
                      {canEdit && (
                        <Popover
                          open={openMenuId === m.id}
                          onClose={() => setOpenMenuId(null)}
                          align="right"
                          width={140}
                          trigger={
                            <button
                              type="button"
                              aria-label="Más acciones"
                              onClick={() => setOpenMenuId((cur) => (cur === m.id ? null : m.id))}
                              className="flex h-7 w-7 items-center justify-center rounded-admin-sm text-admin-text-muted opacity-60 transition-colors hover:bg-admin-border hover:text-admin-text focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <KebabIcon className="h-4 w-4" />
                            </button>
                          }
                        >
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEdit(m);
                              }}
                              className="rounded-admin-sm px-2.5 py-1.5 text-left text-xs font-medium text-admin-text transition-colors hover:bg-admin-bg"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDelete(m);
                              }}
                              className="rounded-admin-sm px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            >
                              Eliminar
                            </button>
                          </div>
                        </Popover>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-admin-border px-4 py-2.5 text-xs text-admin-text-muted">
          <span>
            {resultCount} resultado{resultCount === 1 ? "" : "s"} · página {page} de {pageCount}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-admin-sm transition-colors hover:bg-admin-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-admin-sm transition-colors hover:bg-admin-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 disabled:opacity-30"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
