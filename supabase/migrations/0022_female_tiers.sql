-- Orgullo Embajador — Partidos Femeninos: localidades con precio propio
--
-- Replaces the flat "un precio por partido" model with a shared set of
-- localidades/precios for women's matches — same pattern as public.tiers
-- for men (one shared list used by every match), but a completely separate
-- table so nothing here ever touches public.tiers, its rows, or its prices.
--
-- female_matches.price (0021) is left in place, untouched, for backward
-- compatibility — it simply stops being read by the checkout/public price
-- display once this migration's table is populated from /admin/precios/femeninos.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.female_tiers (
  id text primary key,
  name text not null,
  description text not null default '',
  color text not null default '#0f3fb0',
  price integer not null default 0,
  availability text not null default 'disponible' check (availability in ('disponible', 'baja', 'agotado')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.female_tiers enable row level security;

drop policy if exists "female_tiers_public_read" on public.female_tiers;
create policy "female_tiers_public_read" on public.female_tiers
  for select using (true);

-- Reuses public.is_admin() (0002_admin_v2.sql) — same admin-write model as
-- matches/tiers/female_matches.
drop policy if exists "female_tiers_admin_write" on public.female_tiers;
create policy "female_tiers_admin_write" on public.female_tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed with the same locality names as public.tiers, priced at $0/agotado —
-- a safe, non-guessed starting point the admin fills in from
-- /admin/precios/femeninos, mirroring how public.tiers itself started.
insert into public.female_tiers (id, name, description, color, price, availability, sort_order)
values
  ('femenino-occidental-baja', 'Occidental Baja', '', '#0f3fb0', 0, 'agotado', 1),
  ('femenino-occidental-alta', 'Occidental Alta', '', '#1a56d6', 0, 'agotado', 2),
  ('femenino-oriental', 'Oriental', '', '#cc9a2e', 0, 'agotado', 3),
  ('femenino-norte', 'Norte', '', '#0a2f8c', 0, 'agotado', 4),
  ('femenino-sur', 'Sur', '', '#4d7bea', 0, 'agotado', 5)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
