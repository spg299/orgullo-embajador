-- Orgullo Embajador — Finanzas module + admin access logging
--
-- Adds budget management for the 4 sales advisors (linked to the existing
-- public.advisors table — no duplicate person records) plus a movement
-- history for every ingreso/gasto, and a log of admin-panel access
-- attempts.
--
-- Security model for budgets/budget_movements: any admin can SELECT, but
-- INSERT/UPDATE/DELETE is restricted at the RLS layer to the single email
-- edfabian95@gmail.com via auth.jwt() ->> 'email' — this blocks writes
-- even from a direct authenticated call to Supabase's REST API, not just
-- from this app's own UI/API routes.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste
-- the SQL below (NOT this filename) > Run. Safe to re-run. Run AFTER 0001-0011.

-- =========================================================================
-- 1. budgets: one row per advisor
-- =========================================================================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null unique references public.advisors(id) on delete cascade,
  presupuesto_asignado numeric not null default 0,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

drop policy if exists "budgets_admin_read" on public.budgets;
create policy "budgets_admin_read" on public.budgets
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "budgets_finance_admin_write" on public.budgets;
create policy "budgets_finance_admin_write" on public.budgets
  for all
  using (auth.jwt() ->> 'email' = 'edfabian95@gmail.com')
  with check (auth.jwt() ->> 'email' = 'edfabian95@gmail.com');

-- =========================================================================
-- 2. budget_movements: the financial history (every ingreso/gasto is a row)
-- =========================================================================
create table if not exists public.budget_movements (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  type text not null check (type in ('ingreso', 'gasto')),
  concept text not null,
  amount numeric not null,
  movement_date date not null,
  observations text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists budget_movements_advisor_id_idx on public.budget_movements (advisor_id);
create index if not exists budget_movements_date_idx on public.budget_movements (movement_date);

alter table public.budget_movements enable row level security;

drop policy if exists "budget_movements_admin_read" on public.budget_movements;
create policy "budget_movements_admin_read" on public.budget_movements
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "budget_movements_finance_admin_write" on public.budget_movements;
create policy "budget_movements_finance_admin_write" on public.budget_movements
  for all
  using (auth.jwt() ->> 'email' = 'edfabian95@gmail.com')
  with check (auth.jwt() ->> 'email' = 'edfabian95@gmail.com');

-- =========================================================================
-- 3. admin_access_logs: every denied/rate-limited admin-panel access
--    attempt (see /api/admin/access-log). No public policies at all —
--    service-role only, same reasoning as public.sales in migration 0008.
-- =========================================================================
create table if not exists public.admin_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  path text not null,
  ip text,
  user_agent text,
  result text not null check (result in ('allowed', 'denied_unauthenticated', 'denied_not_admin', 'rate_limited')),
  created_at timestamptz not null default now()
);

create index if not exists admin_access_logs_created_at_idx on public.admin_access_logs (created_at);

alter table public.admin_access_logs enable row level security;

-- =========================================================================
-- Seed: link the 4 existing advisors to a budget row each. No invented
-- starting numbers — presupuesto_asignado stays 0 until the finance admin
-- sets it manually or imports an Excel file.
-- =========================================================================
insert into public.budgets (advisor_id, presupuesto_asignado)
select a.id, 0
from public.advisors a
where not exists (select 1 from public.budgets b where b.advisor_id = a.id);

notify pgrst, 'reload schema';
