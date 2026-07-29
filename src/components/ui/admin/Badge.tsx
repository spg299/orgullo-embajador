import type { ReactNode } from "react";

type BadgeVariant = "success" | "neutral" | "warning" | "danger" | "info";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  neutral: "bg-admin-border text-admin-text-muted",
  warning: "bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  info: "bg-royal-100 text-royal-600 dark:bg-royal-400/15 dark:text-royal-300",
};

export function Badge({
  variant,
  children,
  dot = true,
}: {
  variant: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${VARIANT_STYLES[variant]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
