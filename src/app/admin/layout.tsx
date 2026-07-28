"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRightIcon,
  CalendarIcon,
  GridIcon,
  MailIcon,
  PhotoIcon,
  TicketIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/ui/Icons";

const navItems = [
  { href: "/admin", label: "Resumen", icon: GridIcon },
  { href: "/admin/matches", label: "Partidos", icon: TicketIcon },
  { href: "/admin/hero", label: "Hero", icon: CalendarIcon },
  { href: "/admin/testimonials", label: "Testimonios", icon: PhotoIcon },
  { href: "/admin/videos", label: "Videos", icon: VideoIcon },
  { href: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { href: "/admin/newsletter", label: "Newsletter", icon: MailIcon },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) router.replace("/");
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <p className="text-sm font-medium text-white/60">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-royal-50/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-navy-900/8 bg-navy-950 p-5 lg:flex">
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          Volver al sitio
        </Link>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-navy-900/8 bg-white px-6 py-4 lg:hidden">
          <span className="font-display text-sm font-extrabold text-navy-950">Panel admin</span>
          <Link href="/" className="text-sm font-medium text-royal-500">
            Volver al sitio
          </Link>
        </header>

        <div className="border-b border-navy-900/8 bg-white px-6 py-4">
          <p className="text-sm font-medium text-navy-700/60">
            Conectado como <span className="font-semibold text-navy-950">{profile?.full_name || profile?.email}</span>
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-navy-900/8 bg-white px-4 py-2 lg:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-royal-500 text-white" : "bg-royal-50 text-navy-700"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
