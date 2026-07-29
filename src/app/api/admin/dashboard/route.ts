import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/supabase/adminGuard";
import { SALE_STATUSES, STATUS_LABELS, type SaleStatus } from "@/data/sales";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "3m": 90, "1y": 365 };

interface SaleRow {
  id: string;
  status: SaleStatus;
  created_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
  total: number;
  quantity: number;
  advisor_id: string | null;
  match_label: string;
  buyer_email: string;
}

interface VisitRow {
  visitor_id: string;
  created_at: string;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function revenueDate(sale: SaleRow): string | null {
  return sale.status === "confirmada" ? (sale.confirmed_at ?? sale.updated_at) : null;
}

// The moment a sale was "resolved" one way or another — used for the
// average-response-time KPI. Still-pending solicitudes have no resolution
// yet, so they're excluded from that average.
function resolvedAt(sale: SaleRow): string | null {
  return sale.confirmed_at ?? sale.cancelled_at ?? null;
}

// Delivery is tracked via delivered_at, independent of status — a sale
// stays "confirmada" whether or not it's been delivered yet.
function saleEventLabel(sale: SaleRow): string {
  if (sale.delivered_at) {
    const deliveredTime = new Date(sale.delivered_at).getTime();
    const confirmedTime = sale.confirmed_at ? new Date(sale.confirmed_at).getTime() : -Infinity;
    const cancelledTime = sale.cancelled_at ? new Date(sale.cancelled_at).getTime() : -Infinity;
    if (deliveredTime >= confirmedTime && deliveredTime >= cancelledTime) {
      return `Boletas entregadas — ${sale.match_label}`;
    }
  }
  if (sale.status === "cancelada") return `Venta cancelada — ${sale.match_label}`;
  if (sale.status === "confirmada") return `Venta confirmada — ${sale.match_label}`;
  return `Nueva solicitud — ${sale.match_label}`;
}

function trend(current: number, previous: number): { percent: number | null; direction: "up" | "down" } {
  if (previous === 0) return { percent: current > 0 ? 100 : null, direction: current >= 0 ? "up" : "down" };
  const percent = ((current - previous) / previous) * 100;
  return { percent, direction: percent >= 0 ? "up" : "down" };
}

export async function POST(request: NextRequest) {
  const { accessToken, range } = await request.json();

  const admin = await verifyAdmin(accessToken);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rangeDays = RANGE_DAYS[range as string] ?? 30;
  const now = new Date();
  const since = new Date(now.getTime() - rangeDays * 86400000);
  const previousSince = new Date(since.getTime() - rangeDays * 86400000);
  const oneYearAgo = new Date(now.getTime() - 365 * 86400000);

  const supabaseAdmin = getSupabaseAdmin();

  const [salesRes, saleItemsRes, advisorsRes, profilesRes, testimonialsRes, visitsRes] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select(
        "id, status, created_at, confirmed_at, delivered_at, cancelled_at, updated_at, total, quantity, advisor_id, match_label, buyer_email",
      ),
    supabaseAdmin.from("sale_items").select("tier_name, quantity"),
    supabaseAdmin.from("advisors").select("id, name, color"),
    supabaseAdmin.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
    supabaseAdmin
      .from("testimonials")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("site_visits")
      .select("visitor_id, created_at")
      .gte("created_at", oneYearAgo.toISOString()),
  ]);

  if (salesRes.error) return NextResponse.json({ error: salesRes.error.message }, { status: 400 });

  const sales = (salesRes.data ?? []) as SaleRow[];
  const saleItems = saleItemsRes.data ?? [];
  const advisors = advisorsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const testimonials = testimonialsRes.data ?? [];
  const visits = (visitsRes.data ?? []) as VisitRow[];

  const inRange = (iso: string, from: Date, to: Date) => {
    const t = new Date(iso).getTime();
    return t >= from.getTime() && t < to.getTime();
  };

  // ---- KPIs: current period vs. immediately preceding period of the same length ----
  const currentSales = sales.filter((s) => inRange(s.created_at, since, now));
  const previousSales = sales.filter((s) => inRange(s.created_at, previousSince, since));

  function revenueInPeriod(list: SaleRow[], from: Date, to: Date) {
    return list.reduce((sum, s) => {
      const d = revenueDate(s);
      if (d && inRange(d, from, to)) return sum + s.total;
      return sum;
    }, 0);
  }

  function confirmedCountInPeriod(list: SaleRow[], from: Date, to: Date) {
    return list.filter((s) => s.status === "confirmada" && s.confirmed_at && inRange(s.confirmed_at, from, to))
      .length;
  }

  function deliveredQuantityInPeriod(list: SaleRow[], from: Date, to: Date) {
    return list.reduce((sum, s) => {
      if (s.delivered_at && inRange(s.delivered_at, from, to)) return sum + s.quantity;
      return sum;
    }, 0);
  }

  function ticketsSoldInPeriod(list: SaleRow[], from: Date, to: Date) {
    return list.reduce((sum, s) => {
      if (s.status === "confirmada" && s.confirmed_at && inRange(s.confirmed_at, from, to)) {
        return sum + s.quantity;
      }
      return sum;
    }, 0);
  }

  function uniqueClientsInPeriod(list: SaleRow[], from: Date, to: Date) {
    const emails = new Set<string>();
    for (const s of list) {
      if (s.status === "confirmada" && s.confirmed_at && inRange(s.confirmed_at, from, to)) {
        emails.add(s.buyer_email.toLowerCase());
      }
    }
    return emails.size;
  }

  function avgResponseHoursInPeriod(list: SaleRow[], from: Date, to: Date) {
    const durations: number[] = [];
    for (const s of list) {
      const resolved = resolvedAt(s);
      if (resolved && inRange(resolved, from, to)) {
        const hours = (new Date(resolved).getTime() - new Date(s.created_at).getTime()) / 3600000;
        durations.push(hours);
      }
    }
    if (durations.length === 0) return null;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  function visitorsInPeriod(from: Date, to: Date) {
    const inWindow = visits.filter((v) => inRange(v.created_at, from, to));
    return { unique: new Set(inWindow.map((v) => v.visitor_id)).size, total: inWindow.length };
  }

  function usersCountInPeriod(from: Date, to: Date) {
    return profiles.filter((p) => inRange(p.created_at, from, to)).length;
  }

  const ingresos = revenueInPeriod(sales, since, now);
  const ingresosPrev = revenueInPeriod(sales, previousSince, since);
  const solicitudes = currentSales.length;
  const solicitudesPrev = previousSales.length;
  const confirmadas = confirmedCountInPeriod(sales, since, now);
  const confirmadasPrev = confirmedCountInPeriod(sales, previousSince, since);
  const entregadas = deliveredQuantityInPeriod(sales, since, now);
  const entregadasPrev = deliveredQuantityInPeriod(sales, previousSince, since);
  const boletasVendidas = ticketsSoldInPeriod(sales, since, now);
  const boletasVendidasPrev = ticketsSoldInPeriod(sales, previousSince, since);
  const clientesUnicos = uniqueClientsInPeriod(sales, since, now);
  const clientesUnicosPrev = uniqueClientsInPeriod(sales, previousSince, since);
  const tiempoRespuestaHoras = avgResponseHoursInPeriod(sales, since, now);
  const visitorsCurrent = visitorsInPeriod(since, now);
  const visitorsPrevious = visitorsInPeriod(previousSince, since);
  const usuariosRegistrados = profiles.length;
  const usuariosRegistradosPrev = usersCountInPeriod(previousSince, since);
  const usuariosRegistradosCurrent = usersCountInPeriod(since, now);
  const conversion = visitorsCurrent.unique > 0 ? (confirmadas / visitorsCurrent.unique) * 100 : null;
  const conversionPrev =
    visitorsPrevious.unique > 0 ? (confirmadasPrev / visitorsPrevious.unique) * 100 : null;

  // ---- Ventas por día / Ingresos por período (day buckets across the range) ----
  const salesByDay: { date: string; count: number }[] = [];
  const revenueByDay: { date: string; total: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const key = dayKey(day.toISOString());
    salesByDay.push({
      date: key,
      count: sales.filter((s) => dayKey(s.created_at) === key).length,
    });
    revenueByDay.push({
      date: key,
      total: sales.reduce((sum, s) => {
        const d = revenueDate(s);
        return d && dayKey(d) === key ? sum + s.total : sum;
      }, 0),
    });
  }

  // ---- Status distribution (all-time snapshot) ----
  const statusDistribution = SALE_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: sales.filter((s) => s.status === status).length,
  }));

  // ---- Top matches / top tiers (all-time) ----
  const matchCounts = new Map<string, number>();
  for (const s of sales) matchCounts.set(s.match_label, (matchCounts.get(s.match_label) ?? 0) + 1);
  const topMatches = Array.from(matchCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const tierCounts = new Map<string, number>();
  for (const item of saleItems) {
    tierCounts.set(item.tier_name, (tierCounts.get(item.tier_name) ?? 0) + item.quantity);
  }
  const topTiers = Array.from(tierCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ---- Ventas por asesor (all-time; advisors with zero sales are omitted) ----
  const advisorCounts = new Map<string, number>();
  for (const s of sales) {
    if (!s.advisor_id) continue;
    advisorCounts.set(s.advisor_id, (advisorCounts.get(s.advisor_id) ?? 0) + 1);
  }
  const salesByAdvisor = advisors
    .map((a) => ({ name: a.name, color: a.color, count: advisorCounts.get(a.id) ?? 0 }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);

  // ---- Visitantes: fixed reporting windows, independent of the range selector ----
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const visitorsBreakdown = {
    today: visitorsInPeriod(startOfToday, now).total,
    d7: visitorsInPeriod(new Date(now.getTime() - 7 * 86400000), now).total,
    d15: visitorsInPeriod(new Date(now.getTime() - 15 * 86400000), now).total,
    d30: visitorsInPeriod(new Date(now.getTime() - 30 * 86400000), now).total,
    y1: visitorsInPeriod(oneYearAgo, now).total,
  };

  // ---- Recent activity feed ----
  const saleEvents = [...sales]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 15)
    .map((s) => ({
      type: "sale" as const,
      status: s.status,
      label: saleEventLabel(s),
      timestamp: s.updated_at,
    }));

  const userEvents = profiles.slice(0, 5).map((p) => ({
    type: "user" as const,
    status: null,
    label: `Nuevo usuario: ${p.full_name || "Sin nombre"}`,
    timestamp: p.created_at,
  }));

  const testimonialEvents = testimonials.map((t) => ({
    type: "testimonial" as const,
    status: null,
    label: `Nuevo testimonio de ${t.name}`,
    timestamp: t.created_at,
  }));

  const activity = [...saleEvents, ...userEvents, ...testimonialEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const kpis = {
    ingresos: { value: ingresos, trend: trend(ingresos, ingresosPrev) },
    solicitudes: { value: solicitudes, trend: trend(solicitudes, solicitudesPrev) },
    confirmadas: { value: confirmadas, trend: trend(confirmadas, confirmadasPrev) },
    entregadas: { value: entregadas, trend: trend(entregadas, entregadasPrev) },
    boletasVendidas: { value: boletasVendidas, trend: trend(boletasVendidas, boletasVendidasPrev) },
    visitantesUnicos: { value: visitorsCurrent.unique, trend: trend(visitorsCurrent.unique, visitorsPrevious.unique) },
    visitantesTotales: { value: visitorsCurrent.total, trend: trend(visitorsCurrent.total, visitorsPrevious.total) },
    conversion: { value: conversion, trend: trend(conversion ?? 0, conversionPrev ?? 0) },
    clientesUnicos: { value: clientesUnicos, trend: trend(clientesUnicos, clientesUnicosPrev) },
    usuariosRegistrados: {
      value: usuariosRegistrados,
      trend: trend(usuariosRegistradosCurrent, usuariosRegistradosPrev),
    },
    tiempoRespuestaHoras: { value: tiempoRespuestaHoras },
    asesorConMasVentas: { value: salesByAdvisor[0]?.name ?? "—" },
    partidoMasVendido: { value: topMatches[0]?.label ?? "—" },
    localidadMasVendida: { value: topTiers[0]?.label ?? "—" },
  };

  return NextResponse.json({
    kpis,
    salesByDay,
    revenueByDay,
    statusDistribution,
    topMatches,
    topTiers,
    salesByAdvisor,
    activity,
    visitorsBreakdown,
    funnel: {
      visitors: visitorsCurrent.unique,
      solicitudes,
      confirmadas,
    },
  });
}
