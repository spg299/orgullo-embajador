"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Small anchored panel (not a full-screen modal) — closes on outside click
// or Escape. Used for compact forms (new movement, edit budget) and row
// action menus, matching a dense ops-tool interaction model instead of a
// full-height side Drawer for every edit.
//
// anchor="self" (default) wraps the trigger in its own `position: relative`
// box, so the panel aligns to that one trigger — right for a lone button
// like a row's kebab menu. anchor="group" skips that wrapper and anchors
// to the nearest ancestor the caller already made `position: relative`
// instead — use this for two adjacent trigger buttons (e.g. "Editar
// presupuesto" + "Nuevo movimiento") sharing one relative wrapper, so both
// panels align to the *group's* right edge rather than each button's own,
// which is what actually keeps them on-screen on a narrow viewport (the
// leftmost of two right-aligned buttons sits well left of the container's
// right edge — anchoring a wide panel to just that button's edge can push
// it off the left of the screen).
export function Popover({
  open,
  onClose,
  trigger,
  align = "right",
  width = 300,
  anchor = "self",
  children,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  align?: "left" | "right";
  width?: number;
  anchor?: "self" | "group";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ width }}
          className={`absolute top-[calc(100%+8px)] z-30 max-w-[calc(100vw-2rem)] rounded-admin-lg border border-admin-border bg-admin-surface-raised p-4 shadow-soft ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (anchor === "group") {
    return (
      <div ref={ref} className="contents">
        {trigger}
        {panel}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      {trigger}
      {panel}
    </div>
  );
}
