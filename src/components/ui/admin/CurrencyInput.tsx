"use client";

type Tone = "neutral" | "positive" | "negative";

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-admin-text",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-500",
};

const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-admin-border focus:border-royal-400",
  positive: "border-emerald-300 focus:border-emerald-400 dark:border-emerald-500/40",
  negative: "border-rose-300 focus:border-rose-400 dark:border-rose-500/40",
};

// Fully controlled currency field: the displayed string is derived from
// `value` on every render (no local state, no effect-based sync needed) —
// typing strips to digits, parses to a number, and the formatted display
// re-renders from that number, giving live "1.500.000"-style COP grouping
// as the user types. Compact by design — sits inside tight popover forms,
// not a standalone hero field.
export function CurrencyInput({
  label,
  value,
  onChange,
  tone = "neutral",
  autoFocus,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  tone?: Tone;
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
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-admin-text-muted">$</span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={display}
          onChange={handleChange}
          placeholder="0"
          className={`w-full rounded-admin-md border bg-admin-surface py-2.5 pl-7 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-royal-400/40 ${TONE_BORDER[tone]} ${TONE_TEXT[tone]}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        />
      </div>
    </label>
  );
}
