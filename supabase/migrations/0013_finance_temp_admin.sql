-- Orgullo Embajador — temporary finance-admin permissions for testing
--
-- Grants spg29988@hotmail.com the exact same write permissions as
-- edfabian95@gmail.com on budgets/budget_movements, purely for testing
-- before production. This is TEMPORARY. See src/lib/financeAccess.ts for
-- the matching app-level allowlist.
--
-- TO REVERT once testing is done: re-run this same file after removing
-- 'spg29988@hotmail.com' from the "in (...)" lists below (or restore the
-- single-email `= 'edfabian95@gmail.com'` policies from migration 0012),
-- and remove the email from FINANCE_ADMIN_EMAILS in financeAccess.ts.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste
-- the SQL below (NOT this filename) > Run. Safe to re-run. Run AFTER 0012.

drop policy if exists "budgets_finance_admin_write" on public.budgets;
create policy "budgets_finance_admin_write" on public.budgets
  for all
  using (auth.jwt() ->> 'email' in ('edfabian95@gmail.com', 'spg29988@hotmail.com'))
  with check (auth.jwt() ->> 'email' in ('edfabian95@gmail.com', 'spg29988@hotmail.com'));

drop policy if exists "budget_movements_finance_admin_write" on public.budget_movements;
create policy "budget_movements_finance_admin_write" on public.budget_movements
  for all
  using (auth.jwt() ->> 'email' in ('edfabian95@gmail.com', 'spg29988@hotmail.com'))
  with check (auth.jwt() ->> 'email' in ('edfabian95@gmail.com', 'spg29988@hotmail.com'));

notify pgrst, 'reload schema';
