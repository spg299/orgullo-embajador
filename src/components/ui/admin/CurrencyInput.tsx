"use client";

// Fully controlled currency field: the displayed string is derived from
// `value` on every render (no local state, no effect-based sync needed) —
// typing strips to digits, parses to a number, and the formatted display
// re-renders from that number, giving live "1.500.000"-style COP grouping
// as the user types.
export function CurrencyInput({
  label,
  value,
  onChange,
  large = false,
  autoFocus,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  large?: boolean;
  autoFocus?: boolean;
}) {
  const display = value ? new Intl.NumberFormat("es-CO").format(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits ? Number(digits) : 0);
  }

  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-admin-text/80">{label}</span>}
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-baseline gap-1 font-semibold text-admin-text-muted ${large ? "text-base" : "text-xs"}`}
        >
          COP <span className={large ? "text-2xl" : "text-sm"}>$</span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={display}
          onChange={handleChange}
          placeholder="0"
          className={`w-full rounded-admin-md border border-admin-border bg-admin-surface text-admin-text transition-colors focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40 ${
            large
              ? "py-4 pl-24 font-display text-3xl font-extrabold tracking-tight"
              : "py-2.5 pl-16 text-sm"
          }`}
        />
      </div>
    </label>
  );
}
