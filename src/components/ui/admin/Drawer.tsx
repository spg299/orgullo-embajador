"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "@/components/ui/Icons";

const MAX_WIDTH: Record<"sm" | "md", string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

// Side panel for focused single-record editing (budgets, movements) —
// the premium-SaaS alternative to a centered modal, used wherever a
// Dialog would previously have opened a plain form.
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "sm",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  maxWidth?: "sm" | "md";
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex justify-end bg-navy-950/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`flex h-full w-full ${MAX_WIDTH[maxWidth]} flex-col overflow-y-auto border-l border-admin-border bg-admin-surface shadow-soft`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-admin-border px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">{title}</h2>
                {subtitle && <div className="mt-0.5 text-sm font-medium text-admin-text-muted">{subtitle}</div>}
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-border hover:text-admin-text"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 px-6 py-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
