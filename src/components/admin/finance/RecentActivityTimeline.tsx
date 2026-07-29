"use client";

import { motion } from "framer-motion";
import { formatSignedCOP } from "@/lib/format";
import { movementEffect, type BudgetMovement } from "@/data/finance";
import type { Advisor } from "@/data/advisors";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/ui/Icons";

export function RecentActivityTimeline({
  movements,
  advisors,
  limit = 8,
}: {
  movements: BudgetMovement[];
  advisors: Advisor[];
  limit?: number;
}) {
  const recent = movements.slice(0, limit);
  const advisorName = (id: string) => advisors.find((a) => a.id === id)?.name ?? "—";
  const advisorColor = (id: string) => advisors.find((a) => a.id === id)?.color ?? "#0f3fb0";

  if (recent.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-admin-xl border border-admin-border bg-admin-surface text-sm font-medium text-admin-text-muted">
        Aún no hay movimientos registrados.
      </div>
    );
  }

  return (
    <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-6 shadow-admin-xs">
      <ol className="relative flex flex-col gap-6 before:absolute before:bottom-1 before:left-[15px] before:top-1 before:w-px before:bg-admin-border">
        {recent.map((m, i) => {
          const effect = movementEffect(m);
          const positive = effect >= 0;
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-start gap-4 pl-0"
            >
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  positive
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                }`}
              >
                {positive ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
              </span>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-admin-text">{m.concept}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-admin-text-muted">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: advisorColor(m.advisor_id) }}
                    />
                    {advisorName(m.advisor_id)}
                    <span aria-hidden="true">·</span>
                    {new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-bold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {formatSignedCOP(effect)}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
