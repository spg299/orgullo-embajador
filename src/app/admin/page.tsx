"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { StatCard } from "@/components/ui/admin/StatCard";
import { KpiCard } from "@/components/ui/admin/KpiCard";
import { Select } from "@/components/ui/admin/Select";
import { SkeletonStatCard, Skeleton } from "@/components/ui/admin/Skeleton";
import { SalesLineChart } from "@/components/admin/dashboard/SalesLineChart";
import { RevenueLineChart } from "@/components/admin/dashboard/RevenueLineChart";
import { StatusDonutChart } from "@/components/admin/dashboard/StatusDonutChart";
import { TopBarChart } from "@/components/admin/dashboard/TopBarChart";
import { ActivityFeed, type ActivityEvent } from "@/components/admin/dashboard/ActivityFeed";
import { ConversionFunnel } from "@/components/admin/dashboard/ConversionFunnel";
import { VisitorsBreakdown } from "@/components/admin/dashboard/VisitorsBreakdown";
import {
  TicketIcon,
  TagIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
  PhotoIcon,
  SettingsIcon,
  WalletIcon,
  ChartBarIcon,
  ClockIcon,
} from "@/components/ui/Icons";
import type { SaleStatus } from "@/data/sales";

type Trend = { percent: number | null; direction: "up" | "down" };

function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

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

type Range = "7d" | "30d" | "3m" | "1y";

interface DashboardPayload {
  kpis: {
    ingresos: { value: number; trend: Trend };
    solicitudes: { value: number; trend: Trend };
    confirmadas: { value: number; trend: Trend };
    entregadas: { value: number; trend: Trend };
    boletasVendidas: { value: number; trend: Trend };
    visitantesUnicos: { value: number; trend: Trend };
    visitantesTotales: { value: number; trend: Trend };
    conversion: { value: number | null; trend: Trend };
    clientesUnicos: { value: number; trend: Trend };
    usuariosRegistrados: { value: number; trend: Trend };
    tiempoRespuestaHoras: { value: number | null };
    asesorConMasVentas: { value: string };
    partidoMasVendido: { value: string };
    localidadMasVendida: { value: string };
  };
  salesByDay: { date: string; count: number }[];
  revenueByDay: { date: string; total: number }[];
  statusDistribution: { status: SaleStatus; label: string; count: number }[];
  topMatches: { label: string; count: number }[];
  topTiers: { label: string; count: number }[];
  salesByAdvisor: { name: string; color: string; count: number }[];
  activity: ActivityEvent[];
  visitorsBreakdown: { today: number; d7: number; d15: number; d30: number; y1: number };
  funnel: { visitors: number; solicitudes: number; confirmadas: number };
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "3m", label: "3 meses" },
  { value: "1y", label: "1 año" },
];

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

async function fetchDashboard(range: Range): Promise<DashboardPayload | null> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const res = await fetch("/api/admin/dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, range }),
  });
  if (!res.ok) return null;
  return res.json();
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [range, setRange] = useState<Range>("30d");
  const [commercial, setCommercial] = useState<DashboardPayload | null>(null);
  const loading = stats === null;
  const commercialLoading = commercial === null;

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  useEffect(() => {
    fetchDashboard(range).then(setCommercial);
  }, [range]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
            Dashboard
          </h1>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Panel ejecutivo: ventas, ingresos y actividad comercial en tiempo real.
          </p>
        </div>
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="sm:w-44"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* ---- KPI row ---- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {commercialLoading ? (
          Array.from({ length: 14 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Ingresos"
              value={formatCOP(commercial.kpis.ingresos.value)}
              trend={commercial.kpis.ingresos.trend}
              icon={<WalletIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Solicitudes"
              value={commercial.kpis.solicitudes.value}
              trend={commercial.kpis.solicitudes.trend}
              icon={<ChartBarIcon className="h-5 w-5" />}
              accent="gold"
            />
            <KpiCard
              label="Compras confirmadas"
              value={commercial.kpis.confirmadas.value}
              trend={commercial.kpis.confirmadas.trend}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
            <KpiCard
              label="Boletas vendidas"
              value={commercial.kpis.boletasVendidas.value}
              trend={commercial.kpis.boletasVendidas.trend}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Boletas entregadas"
              value={commercial.kpis.entregadas.value}
              trend={commercial.kpis.entregadas.trend}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <KpiCard
              label="Visitantes únicos"
              value={commercial.kpis.visitantesUnicos.value}
              trend={commercial.kpis.visitantesUnicos.trend}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="gold"
            />
            <KpiCard
              label="Visitantes totales"
              value={commercial.kpis.visitantesTotales.value}
              trend={commercial.kpis.visitantesTotales.trend}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <KpiCard
              label="Conversión"
              value={formatPercent(commercial.kpis.conversion.value)}
              trend={commercial.kpis.conversion.trend}
              icon={<ChartBarIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
            <KpiCard
              label="Clientes únicos"
              value={commercial.kpis.clientesUnicos.value}
              trend={commercial.kpis.clientesUnicos.trend}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Usuarios registrados"
              value={commercial.kpis.usuariosRegistrados.value}
              trend={commercial.kpis.usuariosRegistrados.trend}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="gold"
            />
            <KpiCard
              label="Tiempo prom. de respuesta"
              value={formatDuration(commercial.kpis.tiempoRespuestaHoras.value)}
              icon={<ClockIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <KpiCard
              label="Asesor con más ventas"
              value={commercial.kpis.asesorConMasVentas.value}
              icon={<UsersIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Partido más vendido"
              value={commercial.kpis.partidoMasVendido.value}
              icon={<TicketIcon className="h-5 w-5" />}
              accent="gold"
            />
            <KpiCard
              label="Localidad más vendida"
              value={commercial.kpis.localidadMasVendida.value}
              icon={<TagIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
          </>
        )}
      </div>

      {/* ---- Line charts ---- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Ventas por día
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <SalesLineChart data={commercial.salesByDay} />
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Ingresos por período
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <RevenueLineChart data={commercial.revenueByDay} />
          )}
        </div>
      </div>

      {/* ---- Embudo de conversión + visitantes ---- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Embudo de conversión
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <div className="mt-4">
              <ConversionFunnel
                visitors={commercial.funnel.visitors}
                solicitudes={commercial.funnel.solicitudes}
                confirmadas={commercial.funnel.confirmadas}
              />
            </div>
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Visitantes
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <div className="mt-4">
              <VisitorsBreakdown data={commercial.visitorsBreakdown} />
            </div>
          )}
        </div>
      </div>

      {/* ---- Donut + top bar charts ---- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Distribución por estado
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <StatusDonutChart data={commercial.statusDistribution} />
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Partidos más vendidos
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart data={commercial.topMatches} emptyMessage="Aún no hay ventas registradas." />
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Localidades más vendidas
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart
              data={commercial.topTiers}
              emptyMessage="Aún no hay ventas registradas."
              defaultColor="#cc9a2e"
            />
          )}
        </div>
      </div>

      {/* ---- Ventas por asesor + actividad reciente ---- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Ventas por asesor
          </h3>
          {commercialLoading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart
              data={commercial.salesByAdvisor.map((a) => ({ label: a.name, count: a.count, color: a.color }))}
              emptyMessage="Aún no hay ventas asignadas a asesores."
            />
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">
            Actividad reciente
          </h3>
          {commercialLoading ? (
            <div className="mt-4 flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ActivityFeed events={commercial.activity} />
          )}
        </div>
      </div>

      {/* ---- Secondary: administrative metrics ---- */}
      <h2 className="mt-10 font-display text-lg font-bold tracking-tight text-admin-text">
        Métricas administrativas
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
