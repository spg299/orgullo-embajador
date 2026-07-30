"use client";

// One dense row of label/value pairs divided by hairlines — not cards, no
// icons, no gradients. Density and alignment carry the "professional"
// read, not size. Scrolls horizontally on narrow screens instead of
// wrapping, so the divider logic never has to guess column counts.
export function StatStrip({
  stats,
}: {
  stats: { label: string; value: string; tone?: "credit" | "debit" }[];
}) {
  return (
    <div className="flex overflow-x-auto rounded-admin-lg border border-admin-border bg-admin-surface shadow-admin-xs">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`min-w-[128px] flex-1 shrink-0 px-4 py-3.5 ${i > 0 ? "border-l border-admin-border" : ""}`}
        >
          <p className="whitespace-nowrap text-[10.5px] font-bold uppercase tracking-wider text-admin-text-muted">{s.label}</p>
          <p
            className={`mt-1 text-[18px] font-bold tracking-tight ${
              s.tone === "credit" ? "text-emerald-600 dark:text-emerald-400" : s.tone === "debit" ? "text-rose-500" : "text-admin-text"
            }`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
