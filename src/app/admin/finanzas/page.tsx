"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/admin/Toast";
import { Dialog } from "@/components/ui/admin/Dialog";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Badge } from "@/components/ui/admin/Badge";
import { Select } from "@/components/ui/admin/Select";
import { Input } from "@/components/ui/admin/Input";
import { Textarea } from "@/components/ui/admin/Textarea";
import { Skeleton, SkeletonStatCard } from "@/components/ui/admin/Skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/admin/DataTable";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import { KpiCard } from "@/components/ui/admin/KpiCard";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon, PlusIcon, UploadIcon, DownloadIcon, WalletIcon, ChartBarIcon } from "@/components/ui/Icons";
import { ImportExcelDialog } from "@/components/admin/finance/ImportExcelDialog";
import { formatCOP } from "@/lib/format";
import { BudgetCard } from "@/components/admin/finance/BudgetCard";
import { FinanceLineChart } from "@/components/admin/finance/FinanceLineChart";
import { BudgetDonutChart } from "@/components/admin/finance/BudgetDonutChart";
import { IncomeVsExpenseChart } from "@/components/admin/finance/IncomeVsExpenseChart";
import { TopBarChart } from "@/components/admin/dashboard/TopBarChart";
import { isFinanceAdmin } from "@/lib/financeAccess";
import { summarizeBudget, type Budget, type BudgetMovement, type MovementType } from "@/data/finance";
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

export default function AdminFinanzasPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canEdit = isFinanceAdmin(user?.email);

  const [advisors, setAdvisors] = useState<Advisor[] | null>(null);
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [movements, setMovements] = useState<BudgetMovement[] | null>(null);

  const [editingMovement, setEditingMovement] = useState<Partial<BudgetMovement> | null>(null);
  const [savingMovement, setSavingMovement] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [pendingDeleteMovement, setPendingDeleteMovement] = useState<BudgetMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState(false);

  const [advisorFilter, setAdvisorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  const filteredMovements = useMemo(() => {
    let list = movements ?? [];
    if (advisorFilter) list = list.filter((m) => m.advisor_id === advisorFilter);
    if (dateFrom) list = list.filter((m) => m.movement_date >= dateFrom);
    if (dateTo) list = list.filter((m) => m.movement_date <= dateTo);
    return list;
  }, [movements, advisorFilter, dateFrom, dateTo]);

  const summaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof summarizeBudget>>();
    for (const budget of budgets ?? []) {
      const advisorMovements = (movements ?? []).filter((m) => m.advisor_id === budget.advisor_id);
      map.set(budget.advisor_id, summarizeBudget(budget, advisorMovements));
    }
    return map;
  }, [budgets, movements]);

  const totals = useMemo(() => {
    const presupuestoTotal = (budgets ?? []).reduce((sum, b) => sum + b.presupuesto_asignado, 0);
    const ganado = (movements ?? []).filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
    const gastado = (movements ?? []).filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
    const balance = ganado - gastado;
    const disponible = presupuestoTotal + ganado - gastado;
    const porcentajeEjecutado = presupuestoTotal > 0 ? (gastado / presupuestoTotal) * 100 : 0;
    return { presupuestoTotal, ganado, gastado, balance, disponible, porcentajeEjecutado };
  }, [budgets, movements]);

  const table = useDataTable<BudgetMovement>({
    data: filteredMovements,
    searchableFields: ["concept", "observations"],
    initialSort: { field: "movement_date", direction: "desc" },
  });

  function advisorName(advisorId: string) {
    return advisors?.find((a) => a.id === advisorId)?.name ?? "—";
  }

  async function handleSaveBudget(advisorId: string, presupuesto: number, observaciones: string) {
    const accessToken = await getAccessToken();
    const res = await fetch("/api/finance/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, advisorId, presupuestoAsignado: presupuesto, observaciones }),
    });
    if (res.ok) {
      fetchAll();
      toast.success("Presupuesto actualizado.");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "No se pudo actualizar el presupuesto.");
    }
  }

  async function handleSubmitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMovement) return;
    setSavingMovement(true);
    setMovementError(null);
    const accessToken = await getAccessToken();

    const res = await fetch("/api/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        movement: {
          id: editingMovement.id,
          advisor_id: editingMovement.advisor_id,
          type: editingMovement.type,
          concept: editingMovement.concept,
          amount: Number(editingMovement.amount),
          movement_date: editingMovement.movement_date,
          observations: editingMovement.observations || null,
          created_by: editingMovement.created_by,
        },
      }),
    });

    setSavingMovement(false);
    if (res.ok) {
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
    for (const m of movements ?? []) {
      const key = m.movement_date.slice(0, 7);
      const entry = map.get(key) ?? { ingresos: 0, gastos: 0 };
      if (m.type === "ingreso") entry.ingresos += m.amount;
      else entry.gastos += m.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [movements]);

  const columns: DataTableColumn<BudgetMovement>[] = [
    {
      key: "type",
      header: "Tipo",
      sortable: true,
      render: (m) => <Badge variant={m.type === "ingreso" ? "success" : "danger"}>{m.type === "ingreso" ? "Ingreso" : "Gasto"}</Badge>,
    },
    { key: "concept", header: "Concepto", sortable: true },
    {
      key: "advisor_id",
      header: "Integrante",
      render: (m) => advisorName(m.advisor_id),
    },
    {
      key: "amount",
      header: "Valor",
      sortable: true,
      render: (m) => (
        <span className={m.type === "ingreso" ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-rose-500"}>
          {m.type === "ingreso" ? "+" : "-"}
          {formatCOP(m.amount)}
        </span>
      ),
    },
    {
      key: "movement_date",
      header: "Fecha",
      sortable: true,
      render: (m) => new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO"),
    },
    {
      key: "observations",
      header: "Observaciones",
      render: (m) => <span className="text-admin-text-muted">{m.observations || "—"}</span>,
    },
    {
      key: "profiles",
      header: "Autor",
      render: (m) => m.profiles?.full_name || m.profiles?.email || "—",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">
            💼 Finanzas
          </h1>
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

      {/* ---- Financial KPIs ---- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <KpiCard label="Presupuesto total" value={formatCOP(totals.presupuestoTotal)} icon={<WalletIcon className="h-5 w-5" />} accent="royal" />
            <KpiCard label="Total ganado" value={formatCOP(totals.ganado)} icon={<ChartBarIcon className="h-5 w-5" />} accent="whatsapp" />
            <KpiCard label="Total gastado" value={formatCOP(totals.gastado)} icon={<ChartBarIcon className="h-5 w-5" />} accent="gold" />
            <KpiCard label="Balance general" value={formatCOP(totals.balance)} icon={<WalletIcon className="h-5 w-5" />} accent="neutral" />
            <KpiCard label="Dinero disponible" value={formatCOP(totals.disponible)} icon={<WalletIcon className="h-5 w-5" />} accent="royal" />
            <KpiCard label="% ejecutado" value={`${totals.porcentajeEjecutado.toFixed(1)}%`} icon={<ChartBarIcon className="h-5 w-5" />} accent="gold" />
          </>
        )}
      </div>

      {/* ---- Budget cards ---- */}
      <h2 className="mt-10 font-display text-lg font-bold tracking-tight text-admin-text">Presupuesto por integrante</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-admin-xl" />)
          : advisors?.map((advisor) => {
              const budget = budgets?.find((b) => b.advisor_id === advisor.id);
              if (!budget) return null;
              const summary = summaries.get(advisor.id) ?? { ganado: 0, gastado: 0, balance: 0, disponible: budget.presupuesto_asignado };
              return (
                <BudgetCard
                  key={advisor.id}
                  advisor={advisor}
                  budget={budget}
                  summary={summary}
                  canEdit={canEdit}
                  onSave={(p, o) => handleSaveBudget(advisor.id, p, o)}
                />
              );
            })}
      </div>

      {/* ---- Charts ---- */}
      <h2 className="mt-10 font-display text-lg font-bold tracking-tight text-admin-text">Gráficas</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Evolución mensual</h3>
          {loading ? <Skeleton className="mt-4 h-[240px] w-full" /> : <FinanceLineChart data={monthlyEvolution} />}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Distribución del presupuesto</h3>
          {loading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <BudgetDonutChart
              data={(budgets ?? []).map((b) => ({
                label: advisorName(b.advisor_id),
                value: b.presupuesto_asignado,
                color: advisors?.find((a) => a.id === b.advisor_id)?.color ?? "#0f3fb0",
              }))}
            />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Ingresos vs gastos</h3>
          {loading ? (
            <Skeleton className="mt-4 h-[240px] w-full" />
          ) : (
            <IncomeVsExpenseChart
              data={(advisors ?? []).map((a) => {
                const s = summaries.get(a.id);
                return { label: a.name, ingresos: s?.ganado ?? 0, gastos: s?.gastado ?? 0 };
              })}
            />
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Balance por integrante</h3>
          {loading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart
              data={(advisors ?? []).map((a) => ({
                label: a.name,
                count: summaries.get(a.id)?.balance ?? 0,
                color: a.color,
              }))}
              emptyMessage="Aún no hay movimientos registrados."
              valueFormatter={formatCOP}
            />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Gastos por integrante</h3>
          {loading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart
              data={(advisors ?? []).map((a) => ({ label: a.name, count: summaries.get(a.id)?.gastado ?? 0, color: "#ef4444" }))}
              emptyMessage="Aún no hay gastos registrados."
              valueFormatter={formatCOP}
            />
          )}
        </div>
        <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
          <h3 className="font-display text-base font-bold tracking-tight text-admin-text">Ganancias por integrante</h3>
          {loading ? (
            <Skeleton className="mt-4 h-[220px] w-full" />
          ) : (
            <TopBarChart
              data={(advisors ?? []).map((a) => ({ label: a.name, count: summaries.get(a.id)?.ganado ?? 0, color: "#10b981" }))}
              emptyMessage="Aún no hay ingresos registrados."
              valueFormatter={formatCOP}
            />
          )}
        </div>
      </div>

      {/* ---- Movements history ---- */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">Historial de movimientos</h2>
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
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                onClick={() => {
                  setEditingMovement({ ...emptyMovement, advisor_id: advisors?.[0]?.id });
                  setMovementError(null);
                }}
              >
                Nuevo movimiento
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Select value={advisorFilter} onChange={(e) => setAdvisorFilter(e.target.value)} className="w-48">
          <option value="">Todos los integrantes</option>
          {advisors?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-admin-md border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text"
        />
        <span className="text-xs text-admin-text-muted">hasta</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-admin-md border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text"
        />
      </div>

      <div className="mt-4">
        <DataTable
          table={table}
          keyField="id"
          loading={loading}
          emptyMessage="Aún no hay movimientos registrados."
          searchPlaceholder="Buscar por concepto u observaciones..."
          columns={columns}
          renderActions={
            canEdit
              ? (m) => (
                  <>
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => {
                        setEditingMovement(m);
                        setMovementError(null);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-admin-text-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => setPendingDeleteMovement(m)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )
              : undefined
          }
        />
      </div>

      <Dialog
        open={editingMovement !== null}
        onClose={() => setEditingMovement(null)}
        title={editingMovement?.id ? "Editar movimiento" : "Nuevo movimiento"}
      >
        {editingMovement && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmitMovement}>
            <Select
              label="Integrante"
              value={editingMovement.advisor_id ?? ""}
              onChange={(e) => setEditingMovement({ ...editingMovement, advisor_id: e.target.value })}
            >
              {advisors?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>

            <Select
              label="Tipo"
              value={editingMovement.type ?? "gasto"}
              onChange={(e) => setEditingMovement({ ...editingMovement, type: e.target.value as MovementType })}
            >
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </Select>

            <Input
              label="Concepto"
              required
              value={editingMovement.concept ?? ""}
              onChange={(e) => setEditingMovement({ ...editingMovement, concept: e.target.value })}
            />

            <Input
              label="Valor"
              required
              type="number"
              min={0}
              value={editingMovement.amount ?? 0}
              onChange={(e) => setEditingMovement({ ...editingMovement, amount: Number(e.target.value) })}
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-admin-text/80">Fecha</span>
              <input
                type="date"
                required
                value={editingMovement.movement_date ?? ""}
                onChange={(e) => setEditingMovement({ ...editingMovement, movement_date: e.target.value })}
                className="rounded-admin-md border border-admin-border bg-admin-surface px-4 py-2.5 text-sm text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
              />
            </label>

            <Textarea
              label="Observaciones"
              rows={3}
              value={editingMovement.observations ?? ""}
              onChange={(e) => setEditingMovement({ ...editingMovement, observations: e.target.value })}
            />

            {movementError && <p className="text-sm text-rose-500">{movementError}</p>}

            <div className="mt-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1" disabled={savingMovement}>
                {savingMovement ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditingMovement(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Dialog>

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
        <ImportExcelDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          advisors={advisors ?? []}
          onConfirm={handleImportConfirm}
        />
      )}
    </div>
  );
}
