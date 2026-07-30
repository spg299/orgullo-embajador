"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/ui/admin/KpiCard";
import { EmptyState } from "@/components/ui/admin/EmptyState";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import Button from "@/components/ui/Button";
import { ArrowRightIcon, PencilIcon, PlusIcon, DownloadIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon } from "@/components/ui/Icons";
import { PeriodFilter } from "@/components/admin/finance/PeriodFilter";
import { RecentActivityTimeline } from "@/components/admin/finance/RecentActivityTimeline";
import { TransactionList } from "@/components/admin/finance/TransactionList";
import { FinanceLineChart } from "@/components/admin/finance/FinanceLineChart";
import { CashFlowAreaChart } from "@/components/admin/finance/CashFlowAreaChart";
import { formatCOP } from "@/lib/format";
import { exportMovementsToExcel, exportMovementsToPdf } from "@/lib/finance/exports";
import { resolvePeriodRange, type Budget, type BudgetMovement, type BudgetSummary, type Period } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

function fadeInUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function MemberProfile({
  advisor,
  budget,
  summary,
  movements,
  canEdit,
  onBack,
  onEditBudget,
  onRegisterMovement,
  onEditMovement,
  onDeleteMovement,
}: {
  advisor: Advisor;
  budget: Budget;
  summary: BudgetSummary;
  movements: BudgetMovement[];
  canEdit: boolean;
  onBack: () => void;
  onEditBudget: () => void;
  onRegisterMovement: () => void;
  onEditMovement: (m: BudgetMovement) => void;
  onDeleteMovement: (m: BudgetMovement) => void;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));

  const periodRange = useMemo(
    () => resolvePeriodRange(period, { from: customFrom, to: customTo }),
    [period, customFrom, customTo],
  );
  const periodMovements = useMemo(
    () => movements.filter((m) => m.movement_date >= periodRange.from && m.movement_date <= periodRange.to),
    [movements, periodRange],
  );

  const searchableMovements = useMemo(
    () =>
      periodMovements.map((m) => ({
        ...m,
        _typeLabel: m.type === "ingreso" ? "Ingreso" : "Gasto",
        _dateLabel: new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      })),
    [periodMovements],
  );

  const table = useDataTable({
    data: searchableMovements,
    searchableFields: ["concept", "observations", "_typeLabel", "_dateLabel"],
    initialSort: { field: "movement_date", direction: "desc" },
  });

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
      .map(([key, v]) => ({
        month: new Date(`${key}-01T00:00:00`).toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
        ...v,
      }));
  }, [periodMovements]);

  const cashFlowData = useMemo(
    () => monthlyEvolution.map((m) => ({ label: m.month, balance: m.ingresos - m.gastos })),
    [monthlyEvolution],
  );

  const hasAnyMovements = movements.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-admin-text-muted transition-colors hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40"
      >
        <ArrowRightIcon className="h-4 w-4 rotate-180" />
        Todos los integrantes
      </button>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold text-white"
            style={{ backgroundColor: advisor.color, boxShadow: `0 0 0 4px ${advisor.color}22` }}
          >
            {advisor.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">{advisor.name}</h1>
            <p className="text-sm font-medium text-admin-text-muted">Perfil financiero individual</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<PencilIcon className="h-4 w-4" />} onClick={onEditBudget}>
              Editar presupuesto
            </Button>
            <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={onRegisterMovement}>
              Registrar movimiento
            </Button>
          </div>
        )}
      </div>

      {/* KPIs — always all-time, regardless of the Analíticas period filter below. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-admin-xl bg-gradient-to-br from-royal-500 to-navy-900 p-5 text-white lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Disponible</p>
          <p className={`mt-1 font-display text-3xl font-extrabold tracking-tight ${summary.disponible < 0 ? "text-rose-300" : "text-white"}`}>
            {formatCOP(summary.disponible)}
          </p>
        </div>
        <KpiCard label="Presupuesto" value={formatCOP(budget.presupuesto_asignado)} icon={<WalletIcon className="h-5 w-5" />} accent="royal" />
        <KpiCard label="Ganado" value={formatCOP(summary.ganado)} icon={<TrendingUpIcon className="h-5 w-5" />} accent="whatsapp" />
        <KpiCard label="Gastado" value={formatCOP(summary.gastado)} icon={<TrendingDownIcon className="h-5 w-5" />} accent="gold" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Balance"
          value={formatCOP(summary.balance)}
          description="Ganado menos gastado"
          icon={<WalletIcon className="h-5 w-5" />}
          accent="neutral"
        />
      </div>

      {!hasAnyMovements ? (
        <div className="mt-8">
          <EmptyState
            title={`${advisor.name} aún no tiene movimientos.`}
            description="Registra su primer ingreso o gasto para empezar a ver su historial y sus gráficas."
            actionLabel={canEdit ? "Registrar primer movimiento" : undefined}
            onAction={canEdit ? onRegisterMovement : undefined}
          />
        </div>
      ) : (
        <>
          {/* Analíticas */}
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
              <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Evolución mensual</h3>
              <p className="text-xs font-medium text-admin-text-muted">Ingresos y gastos mes a mes.</p>
              <FinanceLineChart data={monthlyEvolution} />
            </motion.div>
            <motion.div {...fadeInUp(0.1)} className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
              <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Flujo financiero</h3>
              <p className="text-xs font-medium text-admin-text-muted">Flujo neto (ingresos − gastos) mes a mes.</p>
              <CashFlowAreaChart data={cashFlowData} />
            </motion.div>
          </div>

          {/* Historial */}
          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">Historial</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" icon={<DownloadIcon className="h-4 w-4" />} onClick={() => exportMovementsToExcel(periodMovements, [advisor])}>
                Excel
              </Button>
              <Button variant="secondary" size="sm" icon={<DownloadIcon className="h-4 w-4" />} onClick={() => exportMovementsToPdf(periodMovements, [advisor])}>
                PDF
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <RecentActivityTimeline movements={periodMovements} advisors={[advisor]} showAdvisor={false} />
          </div>

          <div className="mt-4">
            <TransactionList
              table={table}
              advisors={[advisor]}
              loading={false}
              canEdit={canEdit}
              showAdvisor={false}
              onEdit={onEditMovement}
              onDelete={onDeleteMovement}
            />
          </div>
        </>
      )}
    </div>
  );
}
