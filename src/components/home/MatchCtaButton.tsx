import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import type { MatchStatus } from "@/data/homeMatches";

// Single source of truth for what a match's CTA says and whether it can be
// clicked. Hero and the calendar both render through this component instead
// of each re-implementing their own status ternary, so a new status value or
// a copy change only ever needs to happen here.
const CTA_LABEL: Record<MatchStatus, string> = {
  available: "Comprar ahora",
  upcoming: "Próximamente",
  sold_out: "Agotado",
};

const SIZE_CLASSES = {
  sm: "text-sm px-4 py-2",
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-4",
};

export default function MatchCtaButton({
  status,
  href,
  size = "md",
  icon,
  className = "",
  availableLabel,
}: {
  status: MatchStatus;
  href: string;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
  /** Optional override for the "available" label, set from /admin/hero. */
  availableLabel?: string;
}) {
  if (status === "available") {
    return (
      <Button
        href={href}
        variant="primary"
        size={size}
        icon={icon}
        iconPosition="right"
        className={className}
      >
        {availableLabel || CTA_LABEL[status]}
      </Button>
    );
  }

  return (
    <button
      type="button"
      disabled
      className={`cursor-not-allowed rounded-full border border-white/10 bg-white/5 font-bold tracking-tight text-white/40 ${SIZE_CLASSES[size]} ${className}`}
    >
      {CTA_LABEL[status]}
    </button>
  );
}
