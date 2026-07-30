"use client";

import type { FormEvent } from "react";
import { Drawer } from "@/components/ui/admin/Drawer";
import { CurrencyInput } from "@/components/ui/admin/CurrencyInput";
import { CollapsibleField } from "@/components/ui/admin/CollapsibleField";
import { Textarea } from "@/components/ui/admin/Textarea";
import Button from "@/components/ui/Button";
import { TrendingUpIcon, TrendingDownIcon, CalendarIcon } from "@/components/ui/Icons";
import type { BudgetMovement, MovementType } from "@/data/finance";
import type { Advisor } from "@/data/advisors";

// The advisor is fixed by the profile this drawer was opened from — it is
// never asked for here, only displayed for context (see MemberProfile).
export function MovementDrawer({
  movement,
  advisor,
  saving,
  error,
  onClose,
  onChange,
  onSubmit,
}: {
  movement: Partial<BudgetMovement> | null;
  advisor: Advisor | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onChange: (movement: Partial<BudgetMovement>) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const type = movement?.type ?? "gasto";
  const isIngreso = type === "ingreso";

  return (
    <Drawer
      open={movement !== null}
      onClose={onClose}
      title={movement?.id ? "Editar movimiento" : "Nuevo movimiento"}
      subtitle={
        advisor && (
          <span className="flex items-center gap-1.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: advisor.color }}
            >
              {advisor.name.slice(0, 1).toUpperCase()}
            </span>
            Para {advisor.name}
          </span>
        )
      }
    >
      {movement && (
        <form className="flex flex-col gap-7" onSubmit={onSubmit}>
          {/* The decision that shapes everything below it — full width, first thing you see. */}
          <div className="grid grid-cols-2 gap-2">
            {(["ingreso", "gasto"] as MovementType[]).map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...movement, type: t })}
                  className={`flex items-center justify-center gap-2 rounded-admin-lg border-2 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40 ${
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

          {/* The number — the actual point of the transaction — as the hero element. */}
          <CurrencyInput
            large
            autoFocus
            tone={isIngreso ? "positive" : "negative"}
            value={movement.amount ?? 0}
            onChange={(amount) => onChange({ ...movement, amount })}
          />

          {/* What — reads like a title, not a boxed input. */}
          <input
            type="text"
            required
            value={movement.concept ?? ""}
            onChange={(e) => onChange({ ...movement, concept: e.target.value })}
            placeholder="¿En qué fue este movimiento?"
            className="w-full border-0 border-b-2 border-admin-border bg-transparent px-0 py-2 font-display text-lg font-bold text-admin-text placeholder:text-admin-text-muted/50 focus:border-royal-400 focus:outline-none focus:ring-0"
          />

          {/* Metadata row — compact, out of the way of the primary flow. */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative inline-flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-semibold text-admin-text">
              <CalendarIcon className="h-3.5 w-3.5 text-admin-text-muted" />
              {movement.movement_date
                ? new Date(`${movement.movement_date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
                : "Selecciona fecha"}
              <input
                type="date"
                required
                value={movement.movement_date ?? ""}
                onChange={(e) => onChange({ ...movement, movement_date: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Fecha"
              />
            </div>

            {!movement.observations && (
              <CollapsibleField label="Agregar nota">
                <Textarea
                  rows={3}
                  autoFocus
                  placeholder="Observaciones (opcional)"
                  value={movement.observations ?? ""}
                  onChange={(e) => onChange({ ...movement, observations: e.target.value })}
                />
              </CollapsibleField>
            )}
          </div>

          {!!movement.observations && (
            <Textarea
              label="Observaciones"
              rows={3}
              value={movement.observations}
              onChange={(e) => onChange({ ...movement, observations: e.target.value })}
            />
          )}

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="mt-1 flex gap-3">
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
