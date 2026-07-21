import { MinusIcon, PlusIcon } from "@/components/ui/Icons";

export default function QuantitySelector({
  value,
  onChange,
  min = 0,
  max = 8,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-navy-900/10 bg-white p-1">
      <button
        type="button"
        aria-label="Disminuir cantidad"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-navy-900/5 disabled:opacity-30"
      >
        <MinusIcon />
      </button>
      <span className="w-4 text-center text-sm font-semibold tabular-nums text-navy-950">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-navy-900/5 disabled:opacity-30"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
