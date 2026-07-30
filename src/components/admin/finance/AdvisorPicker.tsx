"use client";

import type { Advisor } from "@/data/advisors";

// Replaces a plain <select> with a tappable avatar gallery — the same
// picking-a-person interaction Linear/Ramp use for assignee pickers,
// instead of a generic dropdown. Options still come straight from the
// advisors table; there is no free-text entry.
export function AdvisorPicker({
  advisors,
  value,
  onChange,
}: {
  advisors: Advisor[];
  value: string | undefined;
  onChange: (advisorId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {advisors.map((a) => {
        const selected = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl px-2.5 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 ${
              selected ? "bg-admin-bg" : "hover:bg-admin-bg/60"
            }`}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full font-display text-base font-bold text-white transition-all"
              style={{
                backgroundColor: a.color,
                boxShadow: selected ? `0 0 0 3px var(--admin-surface), 0 0 0 5px ${a.color}` : "none",
              }}
            >
              {a.name.slice(0, 1).toUpperCase()}
            </span>
            <span className={`text-[11px] font-semibold ${selected ? "text-admin-text" : "text-admin-text-muted"}`}>
              {a.name.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
