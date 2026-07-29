import { Tier } from "@/data/tiers";
import { availabilityLabels } from "@/data/tiers";

const dotClasses: Record<Tier["availability"], string> = {
  disponible: "bg-emerald-500",
  baja: "bg-gold-500",
  agotado: "bg-white",
};

const textClasses: Record<Tier["availability"], string> = {
  disponible: "text-emerald-700 bg-emerald-50",
  baja: "text-gold-600 bg-gold-100",
  agotado: "text-white bg-red-600",
};

export default function AvailabilityBadge({
  availability,
}: {
  availability: Tier["availability"];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${textClasses[availability]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[availability]}`} />
      {availabilityLabels[availability]}
    </span>
  );
}
