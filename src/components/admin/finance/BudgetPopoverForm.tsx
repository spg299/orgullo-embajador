"use client";

import { useState, type FormEvent } from "react";
import { CurrencyInput } from "@/components/ui/admin/CurrencyInput";
import { CollapsibleField } from "@/components/ui/admin/CollapsibleField";
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

export function BudgetPopoverForm({
  advisor,
  budget,
  summary,
  saving,
  onCancel,
  onSave,
}: {
  advisor: Advisor;
  budget: Budget;
  summary: BudgetSummary;
  saving: boolean;
  onCancel: () => void;
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

  const changed = ganado !== summary.ganado || gastado !== summary.gastado;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <h4 className="font-display text-[13px] font-bold text-admin-text">Editar presupuesto</h4>
        <p className="text-[11px] text-admin-text-muted">{advisor.name}</p>
      </div>

      <CurrencyInput label="Presupuesto asignado" autoFocus value={presupuesto} onChange={setPresupuesto} />

      <div className="grid grid-cols-2 gap-2">
        <CurrencyInput label="Ganado" tone="positive" value={ganado} onChange={setGanado} />
        <CurrencyInput label="Gastado" tone="negative" value={gastado} onChange={setGastado} />
      </div>
      {changed && (
        <p className="text-[11px] text-admin-text-muted">
          Se registrará un movimiento de ajuste automático por la diferencia.
        </p>
      )}

      <CollapsibleField label="Agregar observaciones" defaultOpen={!!budget.observaciones}>
        <Textarea label="Observaciones" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </CollapsibleField>

      <div className="mt-1 flex gap-2">
        <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
