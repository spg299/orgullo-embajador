"use client";

import { formatCOP } from "@/lib/format";
import type { Advisor } from "@/data/advisors";
import type { BudgetSummary } from "@/data/finance";

function RailRow({
  active,
  initial,
  color,
  name,
  sub,
  value,
  negative,
  onClick,
}: {
  active: boolean;
  initial: string;
  color: string;
  name: string;
  sub: string;
  value: string;
  negative?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-admin-sm px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 ${
        active ? "bg-royal-50 dark:bg-royal-500/15" : "hover:bg-admin-bg"
      }`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[12.5px] font-semibold ${active ? "text-royal-600 dark:text-royal-300" : "text-admin-text"}`}>
          {name}
        </span>
        <span className="block truncate text-[10.5px] text-admin-text-muted">{sub}</span>
      </span>
      <span
        className={`shrink-0 text-xs font-semibold ${negative ? "text-rose-500" : "text-admin-text"}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </button>
  );
}

export function MemberRail({
  advisors,
  summaries,
  disponibleTotal,
  selectedId,
  onSelect,
}: {
  advisors: Advisor[];
  summaries: Map<string, BudgetSummary>;
  disponibleTotal: number;
  selectedId: string | null; // null = "Todos"
  onSelect: (id: string | null) => void;
}) {
  return (
    <aside className="overflow-hidden rounded-admin-lg border border-admin-border bg-admin-surface shadow-admin-xs lg:sticky lg:top-6">
      <div className="px-4 pb-2.5 pt-4">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted">Finanzas</p>
        <h1 className="mt-1 font-display text-[17px] font-bold tracking-tight text-admin-text">Integrantes</h1>
      </div>
      <div className="flex flex-col gap-px px-2 pb-3">
        <RailRow
          active={selectedId === null}
          initial="Σ"
          color="#6b7280"
          name="Todos"
          sub="Vista combinada"
          value={formatCOP(disponibleTotal)}
          negative={disponibleTotal < 0}
          onClick={() => onSelect(null)}
        />
        {advisors.map((a) => {
          const s = summaries.get(a.id);
          return (
            <RailRow
              key={a.id}
              active={selectedId === a.id}
              initial={a.name.slice(0, 1).toUpperCase()}
              color={a.color}
              name={a.name}
              sub="Disponible"
              value={formatCOP(s?.disponible ?? 0)}
              negative={(s?.disponible ?? 0) < 0}
              onClick={() => onSelect(a.id)}
            />
          );
        })}
      </div>
    </aside>
  );
}
