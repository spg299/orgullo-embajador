"use client";

import { useState, type FormEvent } from "react";
import { Drawer } from "@/components/ui/admin/Drawer";
import { CurrencyInput } from "@/components/ui/admin/CurrencyInput";
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
  const [presupuesto, setPresupuesto] = useState(budget.presupuesto_asignado);
  const [ganado, setGanado] = useState(summary.ganado);
  const [gastado, setGastado] = useState(summary.gastado);
  const [observaciones, setObservaciones] = useState(budget.observaciones ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ presupuesto, ganado, gastado, observaciones });
  }

  const ganadoChanged = ganado !== summary.ganado;
  const gastadoChanged = gastado !== summary.gastado;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <CurrencyInput label="Presupuesto asignado" value={presupuesto} onChange={setPresupuesto} />

      <div className="flex flex-col gap-4 rounded-admin-md bg-admin-bg p-4">
        <CurrencyInput label="Ganado (total)" value={ganado} onChange={setGanado} />
        <CurrencyInput label="Gastado (total)" value={gastado} onChange={setGastado} />
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
