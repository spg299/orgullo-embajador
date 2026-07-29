"use client";

import type { Period } from "@/data/finance";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

export function PeriodFilter({
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  period: Period;
  onPeriodChange: (period: Period) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap gap-1 rounded-full border border-admin-border bg-admin-bg p-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPeriodChange(opt.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              period === opt.value
                ? "bg-admin-surface text-admin-text shadow-admin-xs"
                : "text-admin-text-muted hover:text-admin-text"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="rounded-admin-md border border-admin-border bg-admin-surface px-3 py-1.5 text-xs text-admin-text"
          />
          <span className="text-xs text-admin-text-muted">hasta</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="rounded-admin-md border border-admin-border bg-admin-surface px-3 py-1.5 text-xs text-admin-text"
          />
        </div>
      )}
    </div>
  );
}
