"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { StatCard } from "@/components/ui/admin/StatCard";
import { SkeletonStatCard } from "@/components/ui/admin/Skeleton";
import {
  TicketIcon,
  TagIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
  PhotoIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

interface DashboardStats {
  matchesTotal: number;
  matchesAvailable: number;
  matchesUpcoming: number;
  matchesSoldOut: number;
  nextMatchRival: string | null;
  tiersCount: number;
  tiersMinPrice: number | null;
  tiersMaxPrice: number | null;
  testimonialsActive: number;
  testimonialsTotal: number;
  usersTotal: number;
  usersAdmins: number;
  heroVideosActive: number;
  heroVideosTotal: number;
  logosCount: number;
}

const quickLinks = [
  { href: "/admin/matches", label: "Partidos", icon: TicketIcon },
  { href: "/admin/precios", label: "Precios", icon: TagIcon },
  { href: "/admin/logos", label: "Logos", icon: PhotoIcon },
  { href: "/admin/hero", label: "Hero", icon: VideoIcon },
  { href: "/admin/testimonials", label: "Testimonios", icon: StarIcon },
  { href: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { href: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
];

async function fetchStats(): Promise<DashboardStats | null> {
  const [matchesRes, tiersRes, testimonialsRes, heroRes, logosRes, sessionRes] = await Promise.all([
    supabase.from("matches").select("rival, status, sort_order").order("sort_order"),
    supabase.from("tiers").select("price"),
    supabase.from("testimonials").select("active"),
    supabase.from("hero_videos").select("active"),
    Promise.all(
      ["site", "millonarios", "rivales"].map((folder) => supabase.storage.from("logos").list(folder)),
    ),
    supabase.auth.getSession(),
  ]);

  const matches = matchesRes.data ?? [];
  const tiers = tiersRes.data ?? [];
  const testimonials = testimonialsRes.data ?? [];
  const heroVideos = heroRes.data ?? [];
  const logosCount = logosRes.reduce((sum, res) => sum + (res.data?.filter((f) => f.id).length ?? 0), 0);

  const accessToken = sessionRes.data.session?.access_token;
  let usersTotal = 0;
  let usersAdmins = 0;
  if (accessToken) {
    const res = await fetch("/api/admin/users/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    if (res.ok) {
      const body = await res.json();
      const users = (body.users ?? []) as { role: "admin" | "user" }[];
      usersTotal = users.length;
      usersAdmins = users.filter((u) => u.role === "admin").length;
    }
  }

  const prices = tiers.map((t) => t.price as number).filter((p) => typeof p === "number");
  // sort_order is the app's canonical ordering (also used by the Hero
  // carousel) — match_date is free text, not a real date, so this is an
  // ordering proxy, not a true chronological "next match."
  const nextMatch = matches.find((m) => m.status !== "sold_out");

  return {
    matchesTotal: matches.length,
    matchesAvailable: matches.filter((m) => m.status === "available").length,
    matchesUpcoming: matches.filter((m) => m.status === "upcoming").length,
    matchesSoldOut: matches.filter((m) => m.status === "sold_out").length,
    nextMatchRival: nextMatch?.rival ?? null,
    tiersCount: tiers.length,
    tiersMinPrice: prices.length ? Math.min(...prices) : null,
    tiersMaxPrice: prices.length ? Math.max(...prices) : null,
    testimonialsActive: testimonials.filter((t) => t.active).length,
    testimonialsTotal: testimonials.length,
    usersTotal,
    usersAdmins,
    heroVideosActive: heroVideos.filter((v) => v.active).length,
    heroVideosTotal: heroVideos.length,
    logosCount,
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const loading = stats === null;

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
        Dashboard
      </h1>
      <p className="mt-1 text-sm font-medium text-admin-text-muted">
        Un vistazo rápido al estado real del sitio.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Partidos"
              value={stats.matchesTotal}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="royal"
            />
            <StatCard
              label="Disponibles"
              value={stats.matchesAvailable}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
            <StatCard
              label="Próximo partido"
              value={stats.nextMatchRival ? `vs ${stats.nextMatchRival}` : "—"}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="gold"
            />
            <StatCard
              label="Agotados"
              value={stats.matchesSoldOut}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <StatCard
              label="Localidades"
              value={stats.tiersCount}
              icon={<TagIcon className="h-5 w-5" />}
              accent="royal"
            />
            <StatCard
              label="Rango de precios"
              value={
                stats.tiersMinPrice !== null
                  ? `${formatCOP(stats.tiersMinPrice)} – ${formatCOP(stats.tiersMaxPrice ?? 0)}`
                  : "—"
              }
              icon={<TagIcon className="h-5 w-5" />}
              accent="gold"
            />
            <StatCard
              label="Testimonios activos"
              value={`${stats.testimonialsActive} / ${stats.testimonialsTotal}`}
              icon={<StarIcon className="h-5 w-5" />}
              accent="gold"
            />
            <StatCard
              label="Usuarios"
              value={stats.usersTotal}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="royal"
            />
            <StatCard
              label="Administradores"
              value={stats.usersAdmins}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
            <StatCard
              label="Videos del Hero"
              value={`${stats.heroVideosActive} / ${stats.heroVideosTotal}`}
              icon={<VideoIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <StatCard
              label="Logos"
              value={stats.logosCount}
              icon={<PhotoIcon className="h-5 w-5" />}
              accent="neutral"
            />
          </>
        )}
      </div>

      <h2 className="mt-10 font-display text-lg font-bold tracking-tight text-admin-text">
        Accesos rápidos
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-4 rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-admin-md bg-gradient-to-br from-royal-500 to-navy-900 text-white">
              <link.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-base font-bold tracking-tight text-admin-text">
              {link.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
