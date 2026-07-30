"use client";

import { useState, type FormEvent } from "react";
import { Drawer } from "@/components/ui/admin/Drawer";
import { CurrencyInput } from "@/components/ui/admin/CurrencyInput";
import { CollapsibleField } from "@/components/ui/admin/CollapsibleField";
import { Textarea } from "@/components/ui/admin/Textarea";
import Button from "@/components/ui/Button";
import { formatCOP } from "@/lib/format";
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
  const disponible = presupuesto + ganado - gastado;

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit}>
      {/* The outcome, computed live — editing the numbers below moves this. */}
      <div className="rounded-admin-xl bg-gradient-to-br from-royal-500 to-navy-900 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Disponible</p>
        <p className={`mt-1 font-display text-3xl font-extrabold tracking-tight ${disponible < 0 ? "text-rose-300" : "text-white"}`}>
          {formatCOP(disponible)}
        </p>
      </div>

      {/* Presupuesto — the one field that isn't a movement-backed total. */}
      <div className="rounded-admin-lg border border-admin-border bg-admin-bg p-4">
        <CurrencyInput label="Presupuesto asignado" autoFocus value={presupuesto} onChange={setPresupuesto} />
      </div>

      {/* Ganado / Gastado — edited as a pair of stat tiles, not two more
          stacked full-width fields, since they're conceptually one
          decision (adjust the totals) rather than two separate ones. */}
      <div className="flex flex-col gap-3 rounded-admin-lg border border-admin-border bg-admin-bg p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-admin-md border border-admin-border bg-admin-surface p-3">
            <CurrencyInput label="Ganado" bare tone="positive" value={ganado} onChange={setGanado} />
          </div>
          <div className="rounded-admin-md border border-admin-border bg-admin-surface p-3">
            <CurrencyInput label="Gastado" bare tone="negative" value={gastado} onChange={setGastado} />
          </div>
        </div>
        {(ganadoChanged || gastadoChanged) && (
          <p className="text-xs font-medium text-admin-text-muted">
            Al guardar se registrará un movimiento de ajuste automático por la diferencia, para que
            el historial siga cuadrando exactamente con estos totales.
          </p>
        )}
      </div>

      <CollapsibleField label="Agregar observaciones" defaultOpen={!!budget.observaciones}>
        <Textarea
          label="Observaciones"
          rows={4}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </CollapsibleField>

      <div className="mt-1 flex gap-3">
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
