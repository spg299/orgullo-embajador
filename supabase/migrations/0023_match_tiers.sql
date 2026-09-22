-- Orgullo Embajador — precios de localidades específicos por partido
--
-- Adds an optional, per-match set of localidades/precios — a match_tiers
-- row is ALWAYS scoped to exactly one match_id. This is deliberately NOT a
-- revival of matches.tier_prices (dropped in 0014_drop_match_tier_price_
-- overrides.sql): that was a JSONB override sitting next to the general
-- price, which made it look like /admin/precios edits silently "didn't
-- save" whenever an override existed. There is no override semantics here
-- — a match either has its OWN fully independent locality list in this
-- table, or (the default, zero rows) keeps using public.tiers exactly as
-- today. Nothing here ever reads or writes public.tiers, female_tiers, or
-- female_matches.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.match_tiers (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#0f3fb0',
  price integer not null default 0,
  availability text not null default 'disponible'
    check (availability in ('disponible', 'baja', 'agotado')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists match_tiers_match_id_idx on public.match_tiers (match_id, sort_order);

alter table public.match_tiers enable row level security;

-- Public read — the checkout page needs to list a match's own localidades
-- for any buyer, same as public.tiers/female_tiers.
drop policy if exists "match_tiers_public_read" on public.match_tiers;
create policy "match_tiers_public_read" on public.match_tiers
  for select using (true);

-- Reuses public.is_admin() (0002_admin_v2.sql) — same admin-write model as
-- tiers/female_tiers/matches/female_matches.
drop policy if exists "match_tiers_admin_write" on public.match_tiers;
create policy "match_tiers_admin_write" on public.match_tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- No seed data: every match keeps using public.tiers until an admin
-- explicitly adds rows here from /admin/matches/[id]/precios.

notify pgrst, 'reload schema';
