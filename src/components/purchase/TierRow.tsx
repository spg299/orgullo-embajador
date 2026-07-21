import QuantitySelector from "@/components/purchase/QuantitySelector";
import AvailabilityBadge from "@/components/ui/AvailabilityBadge";
import { formatCOP } from "@/lib/format";
import type { Tier } from "@/data/tiers";

export default function TierRow({
  tier,
  quantity,
  onChange,
}: {
  tier: Tier;
  quantity: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-5 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between ${
        quantity > 0
          ? "border-royal-300 bg-royal-50/50"
          : "border-navy-900/8 bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className="mt-1 h-4 w-4 shrink-0 rounded-full ring-4 ring-white"
          style={{ backgroundColor: tier.color }}
        />
        <div>
          <p className="font-display text-base font-bold text-navy-950">
            {tier.name}
          </p>
          <p className="mt-0.5 text-sm text-navy-700/60">{tier.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AvailabilityBadge availability={tier.availability} />
            <span className="text-sm font-semibold text-navy-900">
              {formatCOP(tier.price)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end sm:justify-start">
        <QuantitySelector value={quantity} onChange={onChange} />
      </div>
    </div>
  );
}
