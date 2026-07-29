import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/ui/Icons";

type Accent = "royal" | "gold" | "whatsapp" | "neutral";

const ACCENT_STYLES: Record<Accent, string> = {
  royal: "bg-gradient-to-br from-royal-500 to-navy-900 text-white",
  gold: "bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950",
  whatsapp: "bg-gradient-to-br from-whatsapp-500 to-whatsapp-600 text-white",
  neutral: "bg-admin-border text-admin-text",
};

export function KpiCard({
  label,
  value,
  description,
  trend,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
  description?: string;
  trend?: { percent: number | null; direction: "up" | "down" };
  icon?: ReactNode;
  accent?: Accent;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs transition-shadow hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-admin-md ${ACCENT_STYLES[accent]}`}>
            {icon}
          </div>
        )}
        {trend && trend.percent !== null && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.direction === "up"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <TrendingDownIcon className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend.percent).toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-admin-text">{value}</p>
        {description && <p className="mt-1 text-xs font-medium text-admin-text-muted">{description}</p>}
      </div>
    </motion.div>
  );
}
