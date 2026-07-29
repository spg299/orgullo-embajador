"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/admin/Toast";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Select } from "@/components/ui/admin/Select";
import { Skeleton, SkeletonStatCard } from "@/components/ui/admin/Skeleton";
import { EmptyState } from "@/components/ui/admin/EmptyState";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { KpiCard } from "@/components/ui/admin/KpiCard";
import Button from "@/components/ui/Button";
import {
  PlusIcon,
  UploadIcon,
  DownloadIcon,
  WalletIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "@/components/ui/Icons";
import { ImportExcelDialog } from "@/components/admin/finance/ImportExcelDialog";
import { formatCOP } from "@/lib/format";
import { MemberCard } from "@/components/admin/finance/MemberCard";
import { EditMemberDrawer, type MemberEdits } from "@/components/admin/finance/EditMemberDrawer";
import { MovementDrawer } from "@/components/admin/finance/MovementDrawer";
import { RecentActivityTimeline } from "@/components/admin/finance/RecentActivityTimeline";
import { TransactionList } from "@/components/admin/finance/TransactionList";
import { PeriodFilter } from "@/components/admin/finance/PeriodFilter";
import { FinanceLineChart } from "@/components/admin/finance/FinanceLineChart";
import { BudgetDonutChart } from "@/components/admin/finance/BudgetDonutChart";
import { IncomeVsExpenseChart } from "@/components/admin/finance/IncomeVsExpenseChart";
import { CashFlowAreaChart } from "@/components/admin/finance/CashFlowAreaChart";
import { TopBarChart } from "@/components/admin/dashboard/TopBarChart";
import { isFinanceAdmin } from "@/lib/financeAccess";
import {
  summarizeBudget,
  resolvePeriodRange,
  type Budget,
  type BudgetMovement,
  type BudgetSummary,
  type MovementType,
  type Period,
} from "@/data/finance";
import type { Advisor } from "@/data/advisors";
import { exportMovementsToExcel, exportMovementsToPdf } from "@/lib/finance/exports";

const emptyMovement: Partial<BudgetMovement> = {
  type: "gasto",
  concept: "",
  amount: 0,
  movement_date: new Date().toISOString().slice(0, 10),
  observations: "",
};

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

function fadeInUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export default function AdminFinanzasPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canEdit = isFinanceAdmin(user?.email);

  const [advisors, setAdvisors] = useState<Advisor[] | null>(null);
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [movements, setMovements] = useState<BudgetMovement[] | null>(null);

  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [savingMember, setSavingMember] = useState(false);

  const [editingMovement, setEditingMovement] = useState<Partial<BudgetMovement> | null>(null);
  const [savingMovement, setSavingMovement] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [pendingDeleteMovement, setPendingDeleteMovement] = useState<BudgetMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState(false);

  const [advisorFilter, setAdvisorFilter] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [importOpen, setImportOpen] = useState(false);

  const loading = advisors === null || budgets === null || movements === null;

  async function fetchAllData() {
    const [advisorsRes, budgetsRes, movementsRes] = await Promise.all([
      supabase.from("advisors").select("id, profile_id, name, avatar_url, color, active, created_at").order("name"),
      supabase.from("budgets").select("*"),
      supabase
        .from("budget_movements")
        .select("*, profiles(full_name, email)")
        .order("movement_date", { ascending: false }),
    ]);
    return {
      advisors: (advisorsRes.data as Advisor[]) ?? [],
      budgets: (budgetsRes.data as Budget[]) ?? [],
      movements: (movementsRes.data as BudgetMovement[]) ?? [],
    };
  }

  function fetchAll() {
    fetchAllData().then(({ advisors, budgets, movements }) => {
      setAdvisors(advisors);
      setBudgets(budgets);
      setMovements(movements);
    });
  }

  useEffect(() => {
    fetchAllData().then(({ advisors, budgets, movements }) => {
      setAdvisors(advisors);
      setBudgets(budgets);
      setMovements(movements);
    });
  }, []);

  // ---- Period + advisor filtering (drives Analíticas + Movimientos only —
  // Resumen and Integrantes stay cumulative/all-time, since "Disponible" and
  // "Balance" are running totals, not a flow that makes sense to window). ----
  const periodRange = useMemo(
    () => resolvePeriodRange(period, { from: customFrom, to: customTo }),
    [period, customFrom, customTo],
  );

  const periodMovements = useMemo(
    () => (movements ?? []).filter((m) => m.movement_date >= periodRange.from && m.movement_date <= periodRange.to),
    [movements, periodRange],
  );

  const filteredMovements = useMemo(() => {
    if (!advisorFilter) return periodMovements;
    return periodMovements.filter((m) => m.advisor_id === advisorFilter);
  }, [periodMovements, advisorFilter]);

  const searchableMovements = useMemo(
    () =>
      filteredMovements.map((m) => ({
        ...m,
        _advisorName: advisors?.find((a) => a.id === m.advisor_id)?.name ?? "",
        _typeLabel: m.type === "ingreso" ? "Ingreso" : "Gasto",
        _dateLabel: new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      })),
    [filteredMovements, advisors],
  );

  const summaries = useMemo(() => {
    const map = new Map<string, BudgetSummary>();
    for (const budget of budgets ?? []) {
      const advisorMovements = (movements ?? []).filter((m) => m.advisor_id === budget.advisor_id);
      map.set(budget.advisor_id, summarizeBudget(budget, advisorMovements));
    }
    return map;
  }, [budgets, movements]);

  // Period-scoped per-advisor ganado/gastado, used only by Analíticas charts.
  const periodSummaries = useMemo(() => {
    const map = new Map<string, { ganado: number; gastado: number }>();
    for (const advisor of advisors ?? []) {
      const advisorMovements = periodMovements.filter((m) => m.advisor_id === advisor.id);
      const ganado = advisorMovements.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
      const gastado = advisorMovements.filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
      map.set(advisor.id, { ganado, gastado });
    }
    return map;
  }, [advisors, periodMovements]);

  const totals = useMemo(() => {
    const presupuestoTotal = (budgets ?? []).reduce((sum, b) => sum + b.presupuesto_asignado, 0);
    const ganado = (movements ?? []).filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
    const gastado = (movements ?? []).filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
    const balance = ganado - gastado;
    const disponible = presupuestoTotal + ganado - gastado;
    return { presupuestoTotal, ganado, gastado, balance, disponible };
  }, [budgets, movements]);

  // Month-over-month trend for the Resumen KPI cards.
  const trends = useMemo(() => {
    const all = movements ?? [];
    const now = new Date();
    const thisMonthKey = now.toISOString().slice(0, 7);
    const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
    const thisMonth = all.filter((m) => m.movement_date.startsWith(thisMonthKey));
    const lastMonth = all.filter((m) => m.movement_date.startsWith(lastMonthKey));
    const sumType = (list: BudgetMovement[], type: MovementType) =>
      list.filter((m) => m.type === type).reduce((s, m) => s + m.amount, 0);

    const ganadoThis = sumType(thisMonth, "ingreso");
    const ganadoLast = sumType(lastMonth, "ingreso");
    const gastadoThis = sumType(thisMonth, "gasto");
    const gastadoLast = sumType(lastMonth, "gasto");
    const balanceThis = ganadoThis - gastadoThis;
    const balanceLast = ganadoLast - gastadoLast;

    const presupuestoTotal = (budgets ?? []).reduce((s, b) => s + b.presupuesto_asignado, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    const disponibleAsOf = (cutoff: string) => {
      const upTo = all.filter((m) => m.movement_date <= cutoff);
      return presupuestoTotal + sumType(upTo, "ingreso") - sumType(upTo, "gasto");
    };
    const disponibleNow = disponibleAsOf(now.toISOString().slice(0, 10));
    const disponibleLast = disponibleAsOf(lastMonthEnd);

    return {
      ganado: { percent: pctChange(ganadoThis, ganadoLast), direction: (ganadoThis >= ganadoLast ? "up" : "down") as "up" | "down" },
      // Inverted on purpose: for "Total gastado", spending LESS than last
      // month is the good outcome, so it shows green/up even though the
      // raw number went down — matches how a real finance dashboard reads.
      gastado: { percent: pctChange(gastadoThis, gastadoLast), direction: (gastadoThis <= gastadoLast ? "up" : "down") as "up" | "down" },
      balance: { percent: pctChange(balanceThis, balanceLast), direction: (balanceThis >= balanceLast ? "up" : "down") as "up" | "down" },
      disponible: { percent: pctChange(disponibleNow, disponibleLast), direction: (disponibleNow >= disponibleLast ? "up" : "down") as "up" | "down" },
      movimientos: {
        percent: pctChange(thisMonth.length, lastMonth.length),
        direction: (thisMonth.length >= lastMonth.length ? "up" : "down") as "up" | "down",
      },
    };
  }, [movements, budgets]);

  const table = useDataTable({
    data: searchableMovements,
    searchableFields: ["concept", "observations", "_advisorName", "_typeLabel", "_dateLabel"],
    initialSort: { field: "movement_date", direction: "desc" },
  });

  // "Integrantes con mayor ingreso" — ranked by Ganado within the selected
  // period, distinct from the all-time totals shown on the member cards.
  const incomeRanking = useMemo(
    () =>
      (advisors ?? [])
        .map((a) => ({ label: a.name, count: periodSummaries.get(a.id)?.ganado ?? 0, color: a.color }))
        .sort((a, b) => b.count - a.count),
    [advisors, periodSummaries],
  );

  async function handleSaveMember(edits: MemberEdits) {
    if (!editingAdvisor) return;
    const advisorId = editingAdvisor.id;
    const summary = summaries.get(advisorId) ?? { ganado: 0, gastado: 0, balance: 0, disponible: 0 };
    setSavingMember(true);
    const accessToken = await getAccessToken();

    const requests: Promise<Response>[] = [
      fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          advisorId,
          presupuestoAsignado: edits.presupuesto,
          observaciones: edits.observaciones,
        }),
      }),
    ];

    const deltaGanado = edits.ganado - summary.ganado;
    if (deltaGanado !== 0) {
      requests.push(
        fetch("/api/finance/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            movement: {
              advisor_id: advisorId,
              type: "ingreso",
              concept: "Ajuste manual de saldo",
              amount: deltaGanado,
              movement_date: new Date().toISOString().slice(0, 10),
              observations: "Ajuste generado automáticamente al editar el total de Ganado.",
            },
          }),
        }),
      );
    }

    const deltaGastado = edits.gastado - summary.gastado;
    if (deltaGastado !== 0) {
      requests.push(
        fetch("/api/finance/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            movement: {
              advisor_id: advisorId,
              type: "gasto",
              concept: "Ajuste manual de saldo",
              amount: deltaGastado,
              movement_date: new Date().toISOString().slice(0, 10),
              observations: "Ajuste generado automáticamente al editar el total de Gastado.",
            },
          }),
        }),
      );
    }

    const results = await Promise.all(requests);
    setSavingMember(false);
    if (results.every((r) => r.ok)) {
      setEditingAdvisor(null);
      fetchAll();
      toast.success("Integrante actualizado correctamente.");
    } else {
      toast.error("No se pudo actualizar el integrante.");
    }
  }

  function openNewMovement() {
    setEditingMovement({ ...emptyMovement, advisor_id: advisors?.[0]?.id });
    setMovementError(null);
  }

  async function handleSubmitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMovement) return;
    setSavingMovement(true);
    setMovementError(null);
    const accessToken = await getAccessToken();

    const payload = {
      id: editingMovement.id,
      advisor_id: editingMovement.advisor_id!,
      type: editingMovement.type as MovementType,
      concept: editingMovement.concept!,
      amount: Number(editingMovement.amount),
      movement_date: editingMovement.movement_date!,
      observations: editingMovement.observations || null,
      created_by: editingMovement.created_by ?? null,
    };

    const res = await fetch("/api/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, movement: payload }),
    });

    setSavingMovement(false);
    if (res.ok) {
      // Optimistic update: merge the saved movement into local state
      // immediately so KPIs/cards/charts/timeline/list all reflect it in
      // this same render, instead of waiting on a fresh Supabase round
      // trip. fetchAll() below still runs to reconcile with the server's
      // canonical row (real id/created_at/profiles for a brand-new insert).
      setMovements((prev) => {
        if (!prev) return prev;
        if (payload.id) {
          return prev.map((m) => (m.id === payload.id ? { ...m, ...payload, id: m.id } : m));
        }
        const optimistic: BudgetMovement = {
          ...payload,
          id: `optimistic-${Date.now()}`,
          created_at: new Date().toISOString(),
          profiles: null,
        };
        return [optimistic, ...prev];
      });
      setEditingMovement(null);
      fetchAll();
      toast.success("Movimiento guardado correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "No se pudo guardar el movimiento.";
      setMovementError(message);
      toast.error(message);
    }
  }

  async function confirmDeleteMovement() {
    if (!pendingDeleteMovement) return;
    setDeletingMovement(true);
    const accessToken = await getAccessToken();
    const res = await fetch("/api/finance/movements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, id: pendingDeleteMovement.id }),
    });
    setDeletingMovement(false);
    if (res.ok) {
      fetchAll();
      toast.success("Movimiento eliminado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo eliminar el movimiento.");
    }
    setPendingDeleteMovement(null);
  }

  async function handleImportConfirm(
    rows: { advisorId: string; presupuesto: number | null; ingresos: number | null; gastos: number | null }[],
  ) {
    const accessToken = await getAccessToken();
    const res = await fetch("/api/finance/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, rows }),
    });
    if (res.ok) {
      setImportOpen(false);
      fetchAll();
      toast.success("Importación completada correctamente.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo completar la importación.");
    }
  }

  const monthlyEvolution = useMemo(() => {
    const map = new Map<string, { ingresos: number; gastos: number }>();
    for (const m of periodMovements) {
      const key = m.movement_date.slice(0, 7);
      const entry = map.get(key) ?? { ingresos: 0, gastos: 0 };
      if (m.type === "ingreso") entry.ingresos += m.amount;
      else entry.gastos += m.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [periodMovements]);

  const cashFlowData = useMemo(
    () => monthlyEvolution.map((m) => ({ label: m.month, balance: m.ingresos - m.gastos })),
    [monthlyEvolution],
  );

  const editingBudget = editingAdvisor ? (budgets ?? []).find((b) => b.advisor_id === editingAdvisor.id) ?? null : null;
  const editingSummary = editingAdvisor ? summaries.get(editingAdvisor.id) ?? null : null;
  const hasAnyMovements = (movements?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">Finanzas</h1>
          <p className="mt-1 text-sm font-medium text-admin-text-muted">
            Presupuesto del grupo: {advisors?.map((a) => a.name).join(", ") || "…"}.
          </p>
        </div>
        {!canEdit && (
          <p className="rounded-admin-md bg-admin-bg px-3 py-2 text-xs font-medium text-admin-text-muted">
            Solo el administrador financiero puede modificar esta información.
          </p>
        )}
      </div>

      {/* ============ 1. RESUMEN FINANCIERO ============ */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Presupuesto total"
              value={formatCOP(totals.presupuestoTotal)}
              description="Suma asignada a los integrantes"
              icon={<WalletIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Total ganado"
              value={formatCOP(totals.ganado)}
              description="Ingresos acumulados"
              trend={trends.ganado}
              icon={<TrendingUpIcon className="h-5 w-5" />}
              accent="whatsapp"
            />
            <KpiCard
              label="Total gastado"
              value={formatCOP(totals.gastado)}
              description="Egresos acumulados"
              trend={trends.gastado}
              icon={<TrendingDownIcon className="h-5 w-5" />}
              accent="gold"
            />
            <KpiCard
              label="Balance general"
              value={formatCOP(totals.balance)}
              description="Ganado menos gastado"
              trend={trends.balance}
              icon={<WalletIcon className="h-5 w-5" />}
              accent="neutral"
            />
            <KpiCard
              label="Dinero disponible"
              value={formatCOP(totals.disponible)}
              description="Presupuesto más balance"
              trend={trends.disponible}
              icon={<WalletIcon className="h-5 w-5" />}
              accent="royal"
            />
            <KpiCard
              label="Movimientos registrados"
              value={movements?.length ?? 0}
              description="Ingresos y gastos en total"
              trend={trends.movimientos}
              icon={<ChartBarIcon className="h-5 w-5" />}
              accent="gold"
            />
          </>
        )}
      </div>

      {/* ============ 2. ANALÍTICAS ============ */}
      <motion.div {...fadeInUp()} className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">Analíticas</h2>
        <PeriodFilter
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      </motion.div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeInUp(0.05)} className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Distribución del presupuesto</h3>
          <p className="text-xs font-medium text-admin-text-muted">Participación de cada integrante en el presupuesto total.</p>
          {loading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <BudgetDonutChart
              data={(budgets ?? []).map((b) => ({
                label: advisors?.find((a) => a.id === b.advisor_id)?.name ?? "—",
                value: b.presupuesto_asignado,
                color: advisors?.find((a) => a.id === b.advisor_id)?.color ?? "#0f3fb0",
              }))}
            />
          )}
        </motion.div>
        <motion.div {...fadeInUp(0.1)} className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Ingresos vs. gastos por integrante</h3>
          <p className="text-xs font-medium text-admin-text-muted">Comparación directa en el período seleccionado.</p>
          {loading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <IncomeVsExpenseChart
              data={(advisors ?? []).map((a) => {
                const s = periodSummaries.get(a.id);
                return { label: a.name, ingresos: s?.ganado ?? 0, gastos: s?.gastado ?? 0 };
              })}
            />
          )}
        </motion.div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeInUp(0.05)} className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Evolución mensual</h3>
          <p className="text-xs font-medium text-admin-text-muted">Ingresos y gastos mes a mes.</p>
          {loading ? <Skeleton className="mt-4 h-[240px] w-full" /> : <FinanceLineChart data={monthlyEvolution} />}
        </motion.div>
        <motion.div {...fadeInUp(0.1)} className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Flujo financiero</h3>
          <p className="text-xs font-medium text-admin-text-muted">Flujo neto (ingresos − gastos) mes a mes.</p>
          {loading ? <Skeleton className="mt-4 h-[240px] w-full" /> : <CashFlowAreaChart data={cashFlowData} />}
        </motion.div>
      </div>

      <div className="mt-4 grid gap-4">
        <motion.div {...fadeInUp(0.05)} className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Integrantes con mayor ingreso</h3>
          <p className="text-xs font-medium text-admin-text-muted">Ganado por integrante en el período seleccionado.</p>
          {loading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart data={incomeRanking} emptyMessage="Aún no hay ingresos en este período." valueFormatter={formatCOP} />
          )}
        </motion.div>
      </div>

      {/* ============ 3. INTEGRANTES ============ */}
      <motion.h2 {...fadeInUp()} className="mt-12 font-display text-lg font-bold tracking-tight text-admin-text">
        Integrantes
      </motion.h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-admin-xl" />)
          : advisors?.map((advisor) => {
              const budget = budgets?.find((b) => b.advisor_id === advisor.id);
              if (!budget) return null;
              const summary = summaries.get(advisor.id) ?? { ganado: 0, gastado: 0, balance: 0, disponible: budget.presupuesto_asignado };
              return (
                <MemberCard
                  key={advisor.id}
                  advisor={advisor}
                  budget={budget}
                  summary={summary}
                  canEdit={canEdit}
                  onEdit={() => setEditingAdvisor(advisor)}
                />
              );
            })}
      </div>

      {/* ============ 4. MOVIMIENTOS ============ */}
      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">Movimientos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={<DownloadIcon className="h-4 w-4" />} onClick={() => exportMovementsToExcel(filteredMovements, advisors ?? [])}>
            Excel
          </Button>
          <Button variant="secondary" size="sm" icon={<DownloadIcon className="h-4 w-4" />} onClick={() => exportMovementsToPdf(filteredMovements, advisors ?? [])}>
            PDF
          </Button>
          {canEdit && (
            <>
              <Button variant="secondary" size="sm" icon={<UploadIcon className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
                Importar Excel
              </Button>
              <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={openNewMovement}>
                Nuevo movimiento
              </Button>
            </>
          )}
        </div>
      </div>

      {!loading && !hasAnyMovements ? (
        <div className="mt-4">
          <EmptyState
            title="Aún no existen movimientos financieros."
            description="Registra el primer ingreso o gasto para empezar a ver el historial, las gráficas y los KPIs con datos reales."
            actionLabel={canEdit ? "Registrar primer movimiento" : undefined}
            onAction={canEdit ? openNewMovement : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Select value={advisorFilter} onChange={(e) => setAdvisorFilter(e.target.value)} className="w-48">
              <option value="">Todos los integrantes</option>
              {advisors?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-64 w-full rounded-admin-xl" />
            ) : (
              <RecentActivityTimeline movements={filteredMovements} advisors={advisors ?? []} />
            )}
          </div>

          <div className="mt-4">
            <TransactionList
              table={table}
              advisors={advisors ?? []}
              loading={loading}
              canEdit={canEdit}
              onEdit={(m) => {
                setEditingMovement(m);
                setMovementError(null);
              }}
              onDelete={(m) => setPendingDeleteMovement(m)}
            />
          </div>
        </>
      )}

      <EditMemberDrawer
        advisor={editingAdvisor}
        budget={editingBudget}
        summary={editingSummary}
        saving={savingMember}
        onClose={() => setEditingAdvisor(null)}
        onSave={handleSaveMember}
      />

      <MovementDrawer
        movement={editingMovement}
        advisors={advisors ?? []}
        saving={savingMovement}
        error={movementError}
        onClose={() => setEditingMovement(null)}
        onChange={setEditingMovement}
        onSubmit={handleSubmitMovement}
      />

      <ConfirmDialog
        open={pendingDeleteMovement !== null}
        title="Eliminar movimiento"
        description="¿Eliminar este movimiento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deletingMovement}
        onConfirm={confirmDeleteMovement}
        onCancel={() => setPendingDeleteMovement(null)}
      />

      {canEdit && (
        <ImportExcelDialog open={importOpen} onClose={() => setImportOpen(false)} advisors={advisors ?? []} onConfirm={handleImportConfirm} />
      )}
    </div>
  );
}
