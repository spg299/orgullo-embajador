-- Orgullo Embajador — visitor tracking for advanced Dashboard analytics
--
-- Records one row per browsing session on the public site (never on
-- /admin/*), used to compute "Visitantes únicos" / "Visitantes totales"
-- and the visitor→purchase conversion funnel on the Dashboard.
--
-- visitor_id: persisted in the browser's localStorage, long-lived —
--   identifies a distinct device/browser ("visitantes únicos").
-- session_id: persisted in sessionStorage, resets per tab/browser
--   session — the app writes at most one row per session_id, which is
--   how "evitar duplicar visitas del mismo usuario en la misma sesión"
--   is satisfied ("visitantes totales" = count of these session rows).
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste
-- the SQL below (NOT this filename) > Run. Safe to re-run. Run AFTER 0001-0010.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  path text,
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx on public.site_visits (created_at);
create index if not exists site_visits_visitor_id_idx on public.site_visits (visitor_id);

-- RLS enabled with NO policies at all (default-deny), same reasoning as
-- sales/sale_items/advisors in migration 0008: this data is never read
-- on the public site, so every read and write goes through server API
-- routes using the service-role client, not anon RLS policies.
alter table public.site_visits enable row level security;

notify pgrst, 'reload schema';
