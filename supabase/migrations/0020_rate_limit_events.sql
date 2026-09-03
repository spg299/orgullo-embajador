-- Orgullo Embajador — shared, persistent rate-limit store
--
-- Security audit finding (MEDIO): /api/checkout, /api/wompi/create-order,
-- /api/auth/register, /api/visit have no throttling — deliberately not an
-- in-memory counter (Vercel's serverless functions run as multiple,
-- short-lived instances with no shared memory, so an in-process counter
-- would silently under-count and give no real protection). This table is
-- the same durable-counter pattern already proven by admin_access_logs'
-- rate limiting (src/app/api/admin/access-log/route.ts) — a shared,
-- server-side, Supabase-backed store every instance reads/writes the same
-- way.
--
-- `key` encodes route + identifier (e.g. "checkout:203.0.113.5") so one
-- table serves every throttled endpoint. Rows are small and short-lived by
-- purpose (a rate-limit window is a few minutes), but nothing here
-- auto-deletes old rows yet — acceptable for now given the tiny row size;
-- worth a periodic cleanup later if volume grows.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_key_created_at_idx
  on public.rate_limit_events (key, created_at);

-- RLS enabled with NO policies — same reasoning as sales/sale_items/
-- admin_access_logs: only the service-role client (server routes) ever
-- touches this table.
alter table public.rate_limit_events enable row level security;

notify pgrst, 'reload schema';
