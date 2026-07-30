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
// as the user types.
export function CurrencyInput({
  label,
  value,
  onChange,
  large = false,
  bare = false,
  tone = "neutral",
  autoFocus,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  large?: boolean;
  // Compact, borderless variant meant to sit inside its own tile/card
  // (the tile supplies the border) rather than read as a standalone
  // form-field box.
  bare?: boolean;
  tone?: Tone;
  autoFocus?: boolean;
}) {
  const display = value ? new Intl.NumberFormat("es-CO").format(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits ? Number(digits) : 0);
  }

  if (bare) {
    return (
      <label className="flex flex-col gap-0.5">
        {label && <span className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted">{label}</span>}
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-semibold text-admin-text-muted">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            placeholder="0"
            className={`w-full min-w-0 bg-transparent text-sm font-bold focus:outline-none ${TONE_TEXT[tone]}`}
          />
        </div>
      </label>
    );
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
          className={`w-full rounded-admin-md border bg-admin-surface transition-colors focus:outline-none focus:ring-2 focus:ring-royal-400/40 ${TONE_BORDER[tone]} ${
            large
              ? `py-4 pl-24 font-display text-3xl font-extrabold tracking-tight ${TONE_TEXT[tone]}`
              : `py-2.5 pl-16 text-sm text-admin-text`
          }`}
        />
      </div>
    </label>
  );
}
