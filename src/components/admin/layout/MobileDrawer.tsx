"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/Icons";
import { navItems } from "@/components/admin/layout/navItems";

export function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] bg-navy-950/60 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.aside
            className="flex h-full w-72 max-w-[80vw] flex-col bg-navy-950 p-5"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between px-1">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-royal-400 to-royal-600 font-display text-sm font-bold text-white">
                  OE
                </span>
                <span className="font-display text-sm font-extrabold leading-none tracking-tight text-white">
                  Panel admin
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/5 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                if (!item.children) {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-admin-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  );
                }

                const groupActive = item.children.some((child) => pathname === child.href);
                return (
                  <div key={item.href} className="flex flex-col gap-0.5">
                    <div
                      className={`flex items-center gap-3 rounded-admin-md px-3 py-2.5 text-sm font-medium ${
                        groupActive ? "text-white" : "text-white/60"
                      }`}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </div>
                    <div className="ml-[18px] flex flex-col gap-0.5 border-l border-white/10 pl-4">
                      {item.children.map((child) => {
                        const active = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`rounded-admin-md px-3 py-2 text-sm font-medium transition-colors ${
                              active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2 rounded-admin-md px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              Volver al sitio
            </Link>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
