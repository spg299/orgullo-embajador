"use client";

import { useState, type FormEvent } from "react";
import { Drawer } from "@/components/ui/admin/Drawer";
import { Input } from "@/components/ui/admin/Input";
import { Textarea } from "@/components/ui/admin/Textarea";
import Button from "@/components/ui/Button";
import type { Budget, BudgetSummary } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

export interface MemberEdits {
  presupuesto: number;
  ganado: number;
  gastado: number;
  observaciones: string;
}

// Keyed by advisor.id from the parent so opening a different member's
// drawer remounts this form with fresh initial values instead of
// syncing state from props via an effect.
function MemberForm({
  budget,
  summary,
  saving,
  onClose,
  onSave,
}: {
  budget: Budget;
  summary: BudgetSummary;
  saving: boolean;
  onClose: () => void;
  onSave: (edits: MemberEdits) => void;
}) {
  const [presupuesto, setPresupuesto] = useState(String(budget.presupuesto_asignado));
  const [ganado, setGanado] = useState(String(summary.ganado));
  const [gastado, setGastado] = useState(String(summary.gastado));
  const [observaciones, setObservaciones] = useState(budget.observaciones ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      presupuesto: Number(presupuesto) || 0,
      ganado: Number(ganado) || 0,
      gastado: Number(gastado) || 0,
      observaciones,
    });
  }

  const ganadoChanged = Number(ganado) !== summary.ganado;
  const gastadoChanged = Number(gastado) !== summary.gastado;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <Input
        label="Presupuesto asignado"
        type="number"
        min={0}
        value={presupuesto}
        onChange={(e) => setPresupuesto(e.target.value)}
      />

      <div className="flex flex-col gap-4 rounded-admin-md bg-admin-bg p-4">
        <Input label="Ganado (total)" type="number" min={0} value={ganado} onChange={(e) => setGanado(e.target.value)} />
        <Input label="Gastado (total)" type="number" min={0} value={gastado} onChange={(e) => setGastado(e.target.value)} />
        {(ganadoChanged || gastadoChanged) && (
          <p className="text-xs font-medium text-admin-text-muted">
            Al guardar se registrará un movimiento de ajuste automático por la diferencia, para que
            el historial siga cuadrando exactamente con estos totales.
          </p>
        )}
      </div>

      <Textarea label="Observaciones" rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />

      <div className="mt-2 flex gap-3">
        <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function EditMemberDrawer({
  advisor,
  budget,
  summary,
  saving,
  onClose,
  onSave,
}: {
  advisor: Advisor | null;
  budget: Budget | null;
  summary: BudgetSummary | null;
  saving: boolean;
  onClose: () => void;
  onSave: (edits: MemberEdits) => void;
}) {
  return (
    <Drawer open={advisor !== null} onClose={onClose} title={advisor ? `Editar · ${advisor.name}` : "Editar"}>
      {advisor && budget && summary && (
        <MemberForm
          key={advisor.id}
          budget={budget}
          summary={summary}
          saving={saving}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Drawer>
  );
}
