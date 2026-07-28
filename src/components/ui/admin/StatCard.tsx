import type { ReactNode } from "react";
import { motion } from "framer-motion";

type Accent = "royal" | "gold" | "whatsapp" | "neutral";

const ACCENT_STYLES: Record<Accent, string> = {
  royal: "bg-gradient-to-br from-royal-500 to-navy-900 text-white",
  gold: "bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950",
  whatsapp: "bg-gradient-to-br from-whatsapp-500 to-whatsapp-600 text-white",
  neutral: "bg-admin-border text-admin-text",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
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
      {icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-admin-md ${ACCENT_STYLES[accent]}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-admin-text">{value}</p>
      </div>
    </motion.div>
  );
}
