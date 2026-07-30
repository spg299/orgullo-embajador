"use client";

import { motion } from "framer-motion";
import { SearchIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { Skeleton } from "@/components/ui/admin/Skeleton";
import { formatSignedCOP } from "@/lib/format";
import { movementEffect, type BudgetMovement } from "@/data/finance";
import type { Advisor } from "@/data/advisors";
import type { useDataTable } from "@/components/ui/admin/useDataTable";

const SORT_OPTIONS: { field: keyof BudgetMovement; label: string }[] = [
  { field: "movement_date", label: "Fecha" },
  { field: "amount", label: "Valor" },
];

export function TransactionList<T extends BudgetMovement>({
  table,
  advisors,
  loading,
  canEdit,
  onEdit,
  onDelete,
}: {
  table: ReturnType<typeof useDataTable<T>>;
  advisors: Advisor[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (m: T) => void;
  onDelete: (m: T) => void;
}) {
  const { search, setSearch, sort, toggleSort, page, pageCount, setPage, pagedData, resultCount } = table;
  const advisorName = (id: string) => advisors.find((a) => a.id === id)?.name ?? "—";
  const advisorColor = (id: string) => advisors.find((a) => a.id === id)?.color ?? "#0f3fb0";

  return (
    <div className="overflow-hidden rounded-admin-xl border border-admin-border bg-admin-surface shadow-admin-xs">
      <div className="flex flex-col gap-3 border-b border-admin-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por integrante, concepto, fecha o tipo..."
            className="w-full rounded-admin-md border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm text-admin-text placeholder:text-admin-text-muted/60 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-muted">
          Ordenar por
          {SORT_OPTIONS.map((opt) => {
            const active = sort?.field === opt.field;
            return (
              <button
                key={opt.field}
                type="button"
                onClick={() => toggleSort(opt.field)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 ${
                  active ? "bg-admin-bg text-admin-text" : "hover:text-admin-text"
                }`}
              >
                {opt.label}
                {active && (sort!.direction === "asc" ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />)}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : pagedData.length === 0 ? (
        <div className="px-5 py-14 text-center text-sm font-medium text-admin-text-muted">
          Aún no hay movimientos registrados.
        </div>
      ) : (
        <ul className="divide-y divide-admin-border">
          {pagedData.map((m, i) => {
            const effect = movementEffect(m);
            const positive = effect >= 0;
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.03 }}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-admin-bg"
              >
                <span
                  className={`hidden h-2.5 w-2.5 shrink-0 rounded-full sm:block ${
                    positive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-admin-text">{m.concept}</p>
                  {m.observations && (
                    <p className="truncate text-xs font-medium text-admin-text-muted">{m.observations}</p>
                  )}
                </div>
                <div className="hidden w-36 shrink-0 items-center gap-2 sm:flex">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: advisorColor(m.advisor_id) }}
                  >
                    {advisorName(m.advisor_id).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate text-xs font-medium text-admin-text-muted">{advisorName(m.advisor_id)}</span>
                </div>
                <div className="hidden w-28 shrink-0 flex-col md:flex">
                  <span className="text-xs font-medium text-admin-text-muted">
                    {new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </span>
                  <span className="text-[11px] text-admin-text-muted/70">
                    {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <span className="hidden w-28 shrink-0 truncate text-xs font-medium text-admin-text-muted lg:block">
                  {m.profiles?.full_name || m.profiles?.email || "—"}
                </span>
                <span className={`w-28 shrink-0 text-right text-sm font-bold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {formatSignedCOP(effect)}
                </span>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => onEdit(m)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-border hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => onDelete(m)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 dark:hover:bg-rose-500/10"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}

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
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-admin-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-admin-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 disabled:opacity-30"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
