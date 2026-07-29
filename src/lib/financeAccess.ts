// Only this email can create/edit/delete budgets, movements, or import
// Excel data — enforced both client-side (UI gating, see this helper) and
// server-side (every /api/finance/* route, plus the RLS policy in
// migration 0012 which blocks writes even outside this app entirely).
export const FINANCE_ADMIN_EMAIL = "edfabian95@gmail.com";

export function isFinanceAdmin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === FINANCE_ADMIN_EMAIL;
}
