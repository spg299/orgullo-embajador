export type MovementType = "ingreso" | "gasto";

export interface Budget {
  id: string;
  advisor_id: string;
  presupuesto_asignado: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetMovement {
  id: string;
  advisor_id: string;
  type: MovementType;
  concept: string;
  amount: number;
  movement_date: string;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export interface BudgetSummary {
  ganado: number;
  gastado: number;
  balance: number;
  disponible: number;
}

// A movement's net effect on balance: positive for money in, negative for
// money out. Movements normally carry a positive amount, but a manual
// balance adjustment (see EditMemberDrawer) can carry a negative amount to
// correct a total without editing or deleting historical rows — this
// formula makes that correction display with the right sign/color
// everywhere (timeline, transaction list, exports) without special-casing.
export function movementEffect(m: Pick<BudgetMovement, "type" | "amount">): number {
  return m.type === "ingreso" ? m.amount : -m.amount;
}

export type Period = "today" | "week" | "month" | "year" | "custom";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Resolves a quick-select period into an inclusive [from, to] date range
// (YYYY-MM-DD, matching movement_date's format so string comparison works
// directly). "custom" passes the caller-supplied range through unchanged.
export function resolvePeriodRange(
  period: Period,
  custom: { from: string; to: string },
): { from: string; to: string } {
  const now = new Date();
  const today = toISODate(now);

  if (period === "today") return { from: today, to: today };

  if (period === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    return { from: toISODate(monday), to: today };
  }

  if (period === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISODate(first), to: today };
  }

  if (period === "year") {
    const first = new Date(now.getFullYear(), 0, 1);
    return { from: toISODate(first), to: today };
  }

  return custom;
}

// The one formula for every derived financial number — reused by the
// budget cards, KPI row, charts, and exports so nothing can drift.
// disponible = presupuesto_asignado + ganado - gastado: the starting
// allocation plus whatever extra came in, minus what's been spent.
export function summarizeBudget(
  budget: Pick<Budget, "presupuesto_asignado">,
  movements: Pick<BudgetMovement, "type" | "amount">[],
): BudgetSummary {
  const ganado = movements.filter((m) => m.type === "ingreso").reduce((sum, m) => sum + m.amount, 0);
  const gastado = movements.filter((m) => m.type === "gasto").reduce((sum, m) => sum + m.amount, 0);
  const balance = ganado - gastado;
  const disponible = budget.presupuesto_asignado + ganado - gastado;
  return { ganado, gastado, balance, disponible };
}
