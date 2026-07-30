"use client";

import { motion } from "framer-motion";
import { formatCOP } from "@/lib/format";
import { PencilIcon } from "@/components/ui/Icons";
import type { Budget, BudgetSummary } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

const STAT_LABELS: { key: keyof Omit<BudgetSummary, "disponible">; label: string }[] = [
  { key: "ganado", label: "Ganado" },
  { key: "gastado", label: "Gastado" },
  { key: "balance", label: "Balance" },
];

export function MemberCard({
  advisor,
  budget,
  summary,
  canEdit,
  onEdit,
}: {
  advisor: Advisor;
  budget: Budget;
  summary: BudgetSummary;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group flex flex-col rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs transition-shadow duration-300 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-white ring-4 ring-offset-0"
            style={{ backgroundColor: advisor.color, boxShadow: `0 0 0 4px ${advisor.color}22` }}
          >
            {advisor.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-base font-bold tracking-tight text-admin-text">{advisor.name}</p>
            <p className="text-xs font-medium text-admin-text-muted">
              Actualizado {new Date(budget.updated_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!canEdit}
          title={canEdit ? "Editar" : "Solo el administrador financiero puede modificar esta información."}
          onClick={onEdit}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-admin-text-muted opacity-60 transition-all duration-200 hover:bg-admin-bg hover:text-admin-text focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 disabled:cursor-not-allowed disabled:opacity-0 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">Disponible</p>
        <p
          className={`mt-1 font-display text-3xl font-extrabold tracking-tight ${
            summary.disponible < 0 ? "text-rose-500" : "text-admin-text"
          }`}
        >
          {formatCOP(summary.disponible)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-admin-border pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">Presupuesto</p>
          <p className="mt-1 text-sm font-bold text-admin-text">{formatCOP(budget.presupuesto_asignado)}</p>
        </div>
        {STAT_LABELS.map((stat) => (
          <div key={stat.key}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">{stat.label}</p>
            <p
              className={`mt-1 text-sm font-bold ${
                stat.key === "gastado"
                  ? "text-rose-500"
                  : summary[stat.key] < 0
                    ? "text-rose-500"
                    : stat.key === "ganado"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-admin-text"
              }`}
            >
              {formatCOP(summary[stat.key])}
            </p>
          </div>
        ))}
      </div>

      {budget.observaciones && (
        <p className="mt-4 line-clamp-2 rounded-admin-md bg-admin-bg px-3 py-2 text-xs font-medium text-admin-text-muted">
          {budget.observaciones}
        </p>
      )}
    </motion.div>
  );
}
