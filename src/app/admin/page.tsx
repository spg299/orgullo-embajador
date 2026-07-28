"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  CalendarIcon,
  MailIcon,
  PhotoIcon,
  TicketIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/ui/Icons";

const cards = [
  { href: "/admin/matches", label: "Partidos", icon: TicketIcon, table: "matches" },
  { href: "/admin/hero", label: "En el Hero", icon: CalendarIcon, table: null },
  { href: "/admin/testimonials", label: "Testimonios", icon: PhotoIcon, table: "testimonials" },
  { href: "/admin/videos", label: "Videos del Hero", icon: VideoIcon, table: "hero_videos" },
  { href: "/admin/users", label: "Usuarios", icon: UsersIcon, table: "profiles" },
  { href: "/admin/newsletter", label: "Newsletter", icon: MailIcon, table: "profiles" },
] as const;

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      const tables = ["matches", "testimonials", "hero_videos", "profiles"] as const;
      const results = await Promise.all(
        tables.map((table) =>
          supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .then(({ count, error }) => [table, error ? null : (count ?? 0)] as const),
        ),
      );
      if (!cancelled) setCounts(Object.fromEntries(results));
    }
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
        Resumen
      </h1>
      <p className="mt-1 text-sm font-medium text-navy-700/60">
        Administra los partidos, el Hero, los testimonios, los videos, los usuarios y la lista de
        correo desde aquí — sin tocar código.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-3 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-500 to-navy-900 text-white">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-navy-950">
                {card.label}
              </p>
              {card.table && (
                <p className="text-sm font-medium text-navy-700/60">
                  {counts[card.table] === undefined
                    ? "Cargando..."
                    : counts[card.table] === null
                      ? "—"
                      : `${counts[card.table]} registro(s)`}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
