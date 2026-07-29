"use client";

import type { FormEvent } from "react";
import { Drawer } from "@/components/ui/admin/Drawer";
import { Select } from "@/components/ui/admin/Select";
import { Input } from "@/components/ui/admin/Input";
import { CurrencyInput } from "@/components/ui/admin/CurrencyInput";
import { Textarea } from "@/components/ui/admin/Textarea";
import Button from "@/components/ui/Button";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/ui/Icons";
import type { BudgetMovement, MovementType } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

export function MovementDrawer({
  movement,
  advisors,
  saving,
  error,
  onClose,
  onChange,
  onSubmit,
}: {
  movement: Partial<BudgetMovement> | null;
  advisors: Advisor[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onChange: (movement: Partial<BudgetMovement>) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <Drawer
      open={movement !== null}
      onClose={onClose}
      title={movement?.id ? "Editar movimiento" : "Nuevo movimiento"}
    >
      {movement && (
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <Select
            label="Integrante"
            value={movement.advisor_id ?? ""}
            onChange={(e) => onChange({ ...movement, advisor_id: e.target.value })}
          >
            {advisors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>

          <div>
            <span className="text-sm font-medium text-admin-text/80">Tipo</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["ingreso", "gasto"] as MovementType[]).map((t) => {
                const active = (movement.type ?? "gasto") === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ ...movement, type: t })}
                    className={`flex items-center justify-center gap-2 rounded-admin-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? t === "ingreso"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                        : "border-admin-border bg-admin-surface text-admin-text-muted hover:text-admin-text"
                    }`}
                  >
                    {t === "ingreso" ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
                    {t === "ingreso" ? "Ingreso" : "Gasto"}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Concepto"
            required
            value={movement.concept ?? ""}
            onChange={(e) => onChange({ ...movement, concept: e.target.value })}
          />

          <CurrencyInput
            label="Valor"
            large
            value={movement.amount ?? 0}
            onChange={(amount) => onChange({ ...movement, amount })}
          />

          {movement.advisor_id && movement.amount ? (
            <p className="-mt-2 text-center text-xs font-medium text-admin-text-muted">
              Se registrará como <span className="font-semibold text-admin-text">{(movement.type ?? "gasto") === "ingreso" ? "Ingreso" : "Gasto"}</span> para{" "}
              <span className="font-semibold text-admin-text">
                {advisors.find((a) => a.id === movement.advisor_id)?.name}
              </span>
              .
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-admin-text/80">Fecha</span>
            <input
              type="date"
              required
              value={movement.movement_date ?? ""}
              onChange={(e) => onChange({ ...movement, movement_date: e.target.value })}
              className="rounded-admin-md border border-admin-border bg-admin-surface px-4 py-2.5 text-sm text-admin-text focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-400/40"
            />
          </label>

          <Textarea
            label="Observaciones"
            rows={3}
            value={movement.observations ?? ""}
            onChange={(e) => onChange({ ...movement, observations: e.target.value })}
          />

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
