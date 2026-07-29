"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { WalletIcon } from "@/components/ui/Icons";
import Button from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center rounded-admin-xl border border-dashed border-admin-border bg-admin-surface px-6 py-16 text-center"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-royal-400/20 to-gold-400/20 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-royal-500 to-navy-900 text-white shadow-card">
          <WalletIcon className="h-7 w-7" />
        </div>
      </div>
      <p className="mt-6 font-display text-base font-bold tracking-tight text-admin-text">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-sm font-medium text-admin-text-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
