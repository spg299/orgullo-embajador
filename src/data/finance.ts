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
