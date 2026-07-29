// Emails allowed to create/edit/delete budgets, movements, or import Excel
// data — enforced both client-side (UI gating, see this helper) and
// server-side (every /api/finance/* route, plus the RLS policy in
// migrations 0012/0013 which blocks writes even outside this app entirely).
//
// spg29988@hotmail.com was added TEMPORARILY for testing purposes (see
// migration 0013_finance_temp_admin.sql). To revert once testing is done:
// remove it from this array AND re-run a migration that restricts the
// budgets/budget_movements RLS policies back to edfabian95@gmail.com only —
// removing it here alone would leave the DB-level policy more permissive
// than the UI, which isn't the intended end state.
export const FINANCE_ADMIN_EMAILS = ["edfabian95@gmail.com", "spg29988@hotmail.com"];

export function isFinanceAdmin(email: string | null | undefined): boolean {
  return !!email && FINANCE_ADMIN_EMAILS.includes(email.toLowerCase());
}
