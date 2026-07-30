"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/admin/Toast";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Popover } from "@/components/ui/admin/Popover";
import { Skeleton } from "@/components/ui/admin/Skeleton";
import { useDataTable } from "@/components/ui/admin/useDataTable";
import Button from "@/components/ui/Button";
import { UploadIcon, PencilIcon, PlusIcon } from "@/components/ui/Icons";
import { ImportExcelDialog } from "@/components/admin/finance/ImportExcelDialog";
import { MemberRail } from "@/components/admin/finance/MemberRail";
import { StatStrip } from "@/components/admin/finance/StatStrip";
import { FlowSparkline } from "@/components/admin/finance/FlowSparkline";
import { TransactionList } from "@/components/admin/finance/TransactionList";
import { MovementPopoverForm, type MovementFormValues } from "@/components/admin/finance/MovementPopoverForm";
import { BudgetPopoverForm, type MemberEdits } from "@/components/admin/finance/BudgetPopoverForm";
import { isFinanceAdmin } from "@/lib/financeAccess";
import { summarizeBudget, type Budget, type BudgetMovement, type BudgetSummary } from "@/data/finance";
import type { Advisor } from "@/data/advisors";
import { formatCOP } from "@/lib/format";
import { exportMovementsToExcel, exportMovementsToPdf } from "@/lib/finance/exports";

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

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);

  const [budgetPopoverOpen, setBudgetPopoverOpen] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  const [movementPopoverOpen, setMovementPopoverOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<BudgetMovement | null>(null);
  const [savingMovement, setSavingMovement] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [pendingDeleteMovement, setPendingDeleteMovement] = useState<BudgetMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState(false);

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

  const summaries = useMemo(() => {
    const map = new Map<string, BudgetSummary>();
    for (const budget of budgets ?? []) {
      const advisorMovements = (movements ?? []).filter((m) => m.advisor_id === budget.advisor_id);
      map.set(budget.advisor_id, summarizeBudget(budget, advisorMovements));
    }
    return map;
  }, [budgets, movements]);

  const disponibleTotal = useMemo(
    () => Array.from(summaries.values()).reduce((sum, s) => sum + s.disponible, 0),
    [summaries],
  );

  const selectedAdvisor = selectedAdvisorId ? (advisors ?? []).find((a) => a.id === selectedAdvisorId) ?? null : null;
  const selectedBudget = selectedAdvisorId ? (budgets ?? []).find((b) => b.advisor_id === selectedAdvisorId) ?? null : null;
  const selectedSummary = selectedAdvisorId ? summaries.get(selectedAdvisorId) ?? null : null;

  const scopeMovements = useMemo(
    () => (selectedAdvisorId ? (movements ?? []).filter((m) => m.advisor_id === selectedAdvisorId) : movements ?? []),
    [movements, selectedAdvisorId],
  );

  const totals = useMemo(() => {
    const presupuestoTotal = (budgets ?? []).reduce((sum, b) => sum + b.presupuesto_asignado, 0);
    const ganado = (movements ?? []).filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
    const gastado = (movements ?? []).filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
    const balance = ganado - gastado;
    return { presupuestoTotal, ganado, gastado, balance, disponible: presupuestoTotal + balance };
  }, [budgets, movements]);

  const stats = selectedAdvisor && selectedBudget && selectedSummary
    ? [
        { label: "Presupuesto", value: formatCOP(selectedBudget.presupuesto_asignado) },
        { label: "Ganado", value: formatCOP(selectedSummary.ganado), tone: "credit" as const },
        { label: "Gastado", value: formatCOP(selectedSummary.gastado), tone: "debit" as const },
        { label: "Balance", value: formatCOP(selectedSummary.balance) },
        { label: "Disponible", value: formatCOP(selectedSummary.disponible) },
      ]
    : [
        { label: "Presupuesto total", value: formatCOP(totals.presupuestoTotal) },
        { label: "Ganado", value: formatCOP(totals.ganado), tone: "credit" as const },
        { label: "Gastado", value: formatCOP(totals.gastado), tone: "debit" as const },
        { label: "Balance", value: formatCOP(totals.balance) },
        { label: "Disponible", value: formatCOP(totals.disponible) },
      ];

  const monthlyFlow = useMemo(() => {
    const map = new Map<string, { ingresos: number; gastos: number }>();
    for (const m of scopeMovements) {
      const key = m.movement_date.slice(0, 7);
      const entry = map.get(key) ?? { ingresos: 0, gastos: 0 };
      if (m.type === "ingreso") entry.ingresos += m.amount;
      else entry.gastos += m.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => ({
        month: new Date(`${key}-01T00:00:00`).toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
        ...v,
      }));
  }, [scopeMovements]);

  const searchableMovements = useMemo(
    () =>
      scopeMovements.map((m) => ({
        ...m,
        _advisorName: advisors?.find((a) => a.id === m.advisor_id)?.name ?? "",
        _typeLabel: m.type === "ingreso" ? "Ingreso" : "Gasto",
        _dateLabel: new Date(`${m.movement_date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
      })),
    [scopeMovements, advisors],
  );

  const table = useDataTable({
    data: searchableMovements,
    searchableFields: ["concept", "observations", "_advisorName", "_typeLabel", "_dateLabel"],
    initialSort: { field: "movement_date", direction: "desc" },
  });

  async function handleSaveMember(edits: MemberEdits) {
    if (!selectedAdvisor || !selectedSummary) return;
    const advisorId = selectedAdvisor.id;
    setSavingMember(true);
    const accessToken = await getAccessToken();

    const requests: Promise<Response>[] = [
      fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, advisorId, presupuestoAsignado: edits.presupuesto, observaciones: edits.observaciones }),
      }),
    ];

    const deltaGanado = edits.ganado - selectedSummary.ganado;
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

    const deltaGastado = edits.gastado - selectedSummary.gastado;
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
      setBudgetPopoverOpen(false);
      fetchAll();
      toast.success("Integrante actualizado correctamente.");
    } else {
      toast.error("No se pudo actualizar el integrante.");
    }
  }

  async function handleSubmitMovement(values: MovementFormValues) {
    setSavingMovement(true);
    setMovementError(null);
    const accessToken = await getAccessToken();

    const res = await fetch("/api/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, movement: values }),
    });

    setSavingMovement(false);
    if (res.ok) {
      // Optimistic update so the stat strip/sparkline/table reflect the
      // change immediately, instead of waiting on the follow-up refetch.
      setMovements((prev) => {
        if (!prev) return prev;
        if (values.id) {
          return prev.map((m) => (m.id === values.id ? { ...m, ...values, id: m.id } : m));
        }
        const optimistic: BudgetMovement = { ...values, id: `optimistic-${Date.now()}`, created_at: new Date().toISOString(), profiles: null };
        return [optimistic, ...prev];
      });
      setMovementPopoverOpen(false);
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

  const exportAdvisors = selectedAdvisor ? [selectedAdvisor] : advisors ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <Skeleton className="h-96 w-full rounded-admin-lg" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full rounded-admin-lg" />
            <Skeleton className="h-20 w-full rounded-admin-lg" />
            <Skeleton className="h-64 w-full rounded-admin-lg" />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:items-start">
          <MemberRail
            advisors={advisors ?? []}
            summaries={summaries}
            disponibleTotal={disponibleTotal}
            selectedId={selectedAdvisorId}
            onSelect={setSelectedAdvisorId}
          />

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                  style={{ backgroundColor: selectedAdvisor?.color ?? "#6b7280" }}
                >
                  {selectedAdvisor ? selectedAdvisor.name.slice(0, 1).toUpperCase() : "Σ"}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tight text-admin-text">
                    {selectedAdvisor?.name ?? "Todos los integrantes"}
                  </h2>
                  <p className="text-xs text-admin-text-muted">{selectedAdvisor ? "Perfil financiero individual" : "Vista combinada"}</p>
                </div>
              </div>

              {canEdit && selectedAdvisor && selectedBudget && selectedSummary && (
                <div className="relative flex items-center gap-2">
                  <Popover
                    open={budgetPopoverOpen}
                    onClose={() => setBudgetPopoverOpen(false)}
                    width={280}
                    anchor="group"
                    trigger={
                      <Button variant="secondary" size="sm" icon={<PencilIcon className="h-4 w-4" />} onClick={() => setBudgetPopoverOpen((v) => !v)}>
                        Editar presupuesto
                      </Button>
                    }
                  >
                    <BudgetPopoverForm
                      advisor={selectedAdvisor}
                      budget={selectedBudget}
                      summary={selectedSummary}
                      saving={savingMember}
                      onCancel={() => setBudgetPopoverOpen(false)}
                      onSave={handleSaveMember}
                    />
                  </Popover>

                  <Popover
                    open={movementPopoverOpen}
                    onClose={() => {
                      setMovementPopoverOpen(false);
                      setEditingMovement(null);
                    }}
                    width={300}
                    anchor="group"
                    trigger={
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<PlusIcon className="h-4 w-4" />}
                        onClick={() => {
                          setEditingMovement(null);
                          setMovementError(null);
                          setMovementPopoverOpen(true);
                        }}
                      >
                        Nuevo movimiento
                      </Button>
                    }
                  >
                    <MovementPopoverForm
                      advisor={selectedAdvisor}
                      initial={editingMovement ?? undefined}
                      saving={savingMovement}
                      error={movementError}
                      onCancel={() => {
                        setMovementPopoverOpen(false);
                        setEditingMovement(null);
                      }}
                      onSubmit={handleSubmitMovement}
                    />
                  </Popover>
                </div>
              )}
              {!canEdit && (
                <p className="rounded-admin-md bg-admin-bg px-3 py-2 text-xs font-medium text-admin-text-muted">
                  Solo el administrador financiero puede modificar esta información.
                </p>
              )}
              {canEdit && !selectedAdvisor && (
                <Button variant="secondary" size="sm" icon={<UploadIcon className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
                  Importar Excel
                </Button>
              )}
            </div>

            <StatStrip stats={stats} />
            <FlowSparkline data={monthlyFlow} />

            <TransactionList
              table={table}
              advisors={advisors ?? []}
              loading={false}
              canEdit={canEdit}
              showAdvisor={!selectedAdvisor}
              onEdit={(m) => {
                setEditingMovement(m);
                setMovementError(null);
                setMovementPopoverOpen(true);
              }}
              onDelete={(m) => setPendingDeleteMovement(m)}
              onExportExcel={() => exportMovementsToExcel(scopeMovements, exportAdvisors)}
              onExportPdf={() => exportMovementsToPdf(scopeMovements, exportAdvisors)}
              emptyState={
                selectedAdvisor
                  ? {
                      title: `${selectedAdvisor.name} aún no tiene movimientos.`,
                      description: "Registra su primer ingreso o gasto para empezar a ver su historial.",
                      actionLabel: canEdit ? "Registrar movimiento" : undefined,
                      onAction: canEdit
                        ? () => {
                            setEditingMovement(null);
                            setMovementError(null);
                            setMovementPopoverOpen(true);
                          }
                        : undefined,
                    }
                  : { title: "Aún no hay movimientos registrados." }
              }
            />
          </div>
        </div>
      )}

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
