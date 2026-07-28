"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { navItems } from "@/components/admin/layout/navItems";

// Stays dark navy regardless of the admin light/dark toggle — same pattern
// as Vercel/Linear/GitHub (a persistently-dark sidebar framing a
// theme-able content area), and matches this project's existing sidebar,
// which was already dark navy-950 before this redesign.
export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-navy-950 p-5 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-royal-400 to-royal-600 font-display text-sm font-bold text-white">
          OE
        </span>
        <span className="font-display text-sm font-extrabold leading-none tracking-tight text-white">
          Panel admin
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 rounded-admin-md px-3 py-2.5 text-sm font-medium transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="admin-active-nav"
                  className="absolute inset-0 rounded-admin-md bg-white/10"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <item.icon
                className={`relative h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-white/50"}`}
              />
              <span className={`relative ${active ? "text-white" : "text-white/60"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="flex items-center gap-2 rounded-admin-md px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ArrowRightIcon className="h-4 w-4 rotate-180" />
        Volver al sitio
      </Link>
    </aside>
  );
}
