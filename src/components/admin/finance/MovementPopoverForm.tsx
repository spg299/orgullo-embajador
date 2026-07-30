"use client";

import { useState, type FormEvent } from "react";
import { CurrencyInput } from "@/components/ui/admin/CurrencyInput";
import { CollapsibleField } from "@/components/ui/admin/CollapsibleField";
import { Input } from "@/components/ui/admin/Input";
import { Textarea } from "@/components/ui/admin/Textarea";
import Button from "@/components/ui/Button";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/ui/Icons";
import type { BudgetMovement, MovementType } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

export interface MovementFormValues {
  id?: string;
  advisor_id: string;
  type: MovementType;
  amount: number;
  concept: string;
  movement_date: string;
  observations: string | null;
  created_by: string | null;
}

// The advisor is fixed by whichever profile this was opened from — there
// is no field for it here, only the "Para {advisor.name}" line for
// context. Nothing in this form ever asks who the movement is for.
export function MovementPopoverForm({
  advisor,
  initial,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  advisor: Advisor;
  initial?: Partial<BudgetMovement>;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: MovementFormValues) => void;
}) {
  const [type, setType] = useState<MovementType>(initial?.type ?? "gasto");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [concept, setConcept] = useState(initial?.concept ?? "");
  const [date, setDate] = useState(initial?.movement_date ?? new Date().toISOString().slice(0, 10));
  const [observations, setObservations] = useState(initial?.observations ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      id: initial?.id,
      advisor_id: advisor.id,
      type,
      amount,
      concept,
      movement_date: date,
      observations: observations || null,
      created_by: initial?.created_by ?? null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <h4 className="font-display text-[13px] font-bold text-admin-text">{initial?.id ? "Editar movimiento" : "Nuevo movimiento"}</h4>
        <p className="text-[11px] text-admin-text-muted">Para {advisor.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {(["ingreso", "gasto"] as MovementType[]).map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center justify-center gap-1.5 rounded-admin-sm border py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 ${
                active
                  ? t === "ingreso"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                  : "border-admin-border bg-admin-surface text-admin-text-muted hover:text-admin-text"
              }`}
            >
              {t === "ingreso" ? <TrendingUpIcon className="h-3.5 w-3.5" /> : <TrendingDownIcon className="h-3.5 w-3.5" />}
              {t === "ingreso" ? "Ingreso" : "Gasto"}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CurrencyInput label="Valor" autoFocus tone={type === "ingreso" ? "positive" : "negative"} value={amount} onChange={setAmount} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-admin-text/80">Fecha</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-admin-md border border-admin-border bg-admin-surface px-3 py-2.5 text-sm text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
          />
        </label>
      </div>

      <Input label="Concepto" required value={concept} onChange={(e) => setConcept(e.target.value)} />

      {!observations && (
        <CollapsibleField label="Agregar nota">
          <Textarea rows={2} autoFocus placeholder="Observaciones (opcional)" value={observations} onChange={(e) => setObservations(e.target.value)} />
        </CollapsibleField>
      )}
      {!!observations && <Textarea label="Observaciones" rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />}

      {error && <p className="text-xs text-rose-500">{error}</p>}

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
