"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/admin/Toast";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { Skeleton } from "@/components/ui/admin/Skeleton";
import Button from "@/components/ui/Button";
import { UploadIcon } from "@/components/ui/Icons";
import { ImportExcelDialog } from "@/components/admin/finance/ImportExcelDialog";
import { MemberCard } from "@/components/admin/finance/MemberCard";
import { MemberProfile } from "@/components/admin/finance/MemberProfile";
import { EditMemberDrawer, type MemberEdits } from "@/components/admin/finance/EditMemberDrawer";
import { MovementDrawer } from "@/components/admin/finance/MovementDrawer";
import { isFinanceAdmin } from "@/lib/financeAccess";
import { summarizeBudget, type Budget, type BudgetMovement, type BudgetSummary, type MovementType } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

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

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);

  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [savingMember, setSavingMember] = useState(false);

  const [editingMovement, setEditingMovement] = useState<Partial<BudgetMovement> | null>(null);
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

  const selectedAdvisor = selectedAdvisorId ? (advisors ?? []).find((a) => a.id === selectedAdvisorId) ?? null : null;
  const selectedBudget = selectedAdvisorId ? (budgets ?? []).find((b) => b.advisor_id === selectedAdvisorId) ?? null : null;
  const selectedMovements = useMemo(
    () => (selectedAdvisorId ? (movements ?? []).filter((m) => m.advisor_id === selectedAdvisorId) : []),
    [movements, selectedAdvisorId],
  );

  // The Drawer for both new and existing movements always belongs to
  // whichever advisor is currently open — MovementDrawer never asks.
  const movementAdvisor = editingMovement
    ? (advisors ?? []).find((a) => a.id === editingMovement.advisor_id) ?? null
    : null;

  function openNewMovementFor(advisorId: string) {
    setEditingMovement({ ...emptyMovement, advisor_id: advisorId });
    setMovementError(null);
  }

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
      // immediately so the profile's KPIs/charts/history reflect it in
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

  return (
    <div className="mx-auto max-w-6xl">
      <AnimatePresence mode="wait">
        {selectedAdvisor && selectedBudget ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <MemberProfile
              advisor={selectedAdvisor}
              budget={selectedBudget}
              summary={summaries.get(selectedAdvisor.id) ?? { ganado: 0, gastado: 0, balance: 0, disponible: selectedBudget.presupuesto_asignado }}
              movements={selectedMovements}
              canEdit={canEdit}
              onBack={() => setSelectedAdvisorId(null)}
              onEditBudget={() => setEditingAdvisor(selectedAdvisor)}
              onRegisterMovement={() => openNewMovementFor(selectedAdvisor.id)}
              onEditMovement={(m) => {
                setEditingMovement(m);
                setMovementError(null);
              }}
              onDeleteMovement={(m) => setPendingDeleteMovement(m)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="selector"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-admin-text">Finanzas</h1>
                <p className="mt-1 text-sm font-medium text-admin-text-muted">
                  Selecciona un integrante para ver su perfil financiero.
                </p>
              </div>
              {canEdit ? (
                <Button variant="secondary" size="sm" icon={<UploadIcon className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
                  Importar Excel
                </Button>
              ) : (
                <p className="rounded-admin-md bg-admin-bg px-3 py-2 text-xs font-medium text-admin-text-muted">
                  Solo el administrador financiero puede modificar esta información.
                </p>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-admin-xl" />)
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
                        onSelect={() => setSelectedAdvisorId(advisor.id)}
                        onEdit={() => setEditingAdvisor(advisor)}
                      />
                    );
                  })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditMemberDrawer
        advisor={editingAdvisor}
        budget={editingAdvisor ? (budgets ?? []).find((b) => b.advisor_id === editingAdvisor.id) ?? null : null}
        summary={editingAdvisor ? summaries.get(editingAdvisor.id) ?? null : null}
        saving={savingMember}
        onClose={() => setEditingAdvisor(null)}
        onSave={handleSaveMember}
      />

      <MovementDrawer
        movement={editingMovement}
        advisor={movementAdvisor}
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
