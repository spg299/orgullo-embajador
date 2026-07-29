"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";
import { PencilIcon } from "@/components/ui/Icons";
import type { Budget, BudgetSummary } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

export function BudgetCard({
  advisor,
  budget,
  summary,
  canEdit,
  onSave,
}: {
  advisor: Advisor;
  budget: Budget;
  summary: BudgetSummary;
  canEdit: boolean;
  onSave: (presupuesto: number, observaciones: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [presupuesto, setPresupuesto] = useState(String(budget.presupuesto_asignado));
  const [observaciones, setObservaciones] = useState(budget.observaciones ?? "");

  function startEdit() {
    setPresupuesto(String(budget.presupuesto_asignado));
    setObservaciones(budget.observaciones ?? "");
    setEditing(true);
  }

  function save() {
    onSave(Number(presupuesto) || 0, observaciones);
    setEditing(false);
  }

  return (
    <div className="rounded-admin-xl border border-admin-border bg-admin-surface p-5 shadow-admin-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
            style={{ backgroundColor: advisor.color }}
          >
            {advisor.name.slice(0, 1).toUpperCase()}
          </div>
          <p className="font-display text-base font-bold tracking-tight text-admin-text">{advisor.name}</p>
        </div>
        <button
          type="button"
          disabled={!canEdit}
          title={canEdit ? "Editar presupuesto" : "Solo el administrador financiero puede modificar esta información."}
          onClick={startEdit}
          className="flex items-center gap-1.5 rounded-full bg-admin-bg px-3 py-1.5 text-xs font-semibold text-admin-text transition-colors hover:bg-admin-border disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PencilIcon className="h-3.5 w-3.5" />
          Editar
        </button>
      </div>

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-admin-text-muted">Presupuesto asignado</span>
            <input
              type="number"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              className="rounded-admin-sm border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-admin-text-muted">Observaciones</span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="rounded-admin-sm border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="flex-1 rounded-admin-sm bg-royal-500 px-3 py-2 text-xs font-semibold text-white hover:bg-royal-600"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-admin-sm px-3 py-2 text-xs font-semibold text-admin-text-muted hover:bg-admin-bg"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
          <div>
            <p className="text-xs font-medium text-admin-text-muted">Presupuesto</p>
            <p className="font-semibold text-admin-text">{formatCOP(budget.presupuesto_asignado)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-admin-text-muted">Disponible</p>
            <p className={`font-semibold ${summary.disponible < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
              {formatCOP(summary.disponible)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-admin-text-muted">Total ganado</p>
            <p className="font-semibold text-admin-text">{formatCOP(summary.ganado)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-admin-text-muted">Total gastado</p>
            <p className="font-semibold text-admin-text">{formatCOP(summary.gastado)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-admin-text-muted">Balance</p>
            <p className={`font-semibold ${summary.balance < 0 ? "text-rose-500" : "text-admin-text"}`}>
              {formatCOP(summary.balance)}
            </p>
          </div>
          {budget.observaciones && (
            <div className="col-span-2 mt-1 rounded-admin-sm bg-admin-bg p-2.5">
              <p className="text-xs font-medium text-admin-text-muted">Observaciones</p>
              <p className="mt-0.5 text-xs text-admin-text">{budget.observaciones}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
