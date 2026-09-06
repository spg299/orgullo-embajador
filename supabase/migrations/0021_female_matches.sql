-- Orgullo Embajador — Partidos Femeninos (independent from men's matches/tiers)
--
-- New, fully separate table for women's matches — deliberately NOT reusing
-- `matches` (which hardcodes Millonarios as the home team and only stores
-- the rival) or `tiers` (a shared 4-locality pricing system every men's
-- match uses). Women's matches store both team names directly and have a
-- single flat price per match, matching the actual requirement ($15.000
-- COP per boleta for Millonarios vs Nacional — Femenino, with future
-- matches expected to have their own independent price).
--
-- `status` reuses the exact 3-state convention already used by
-- `matches.status` (available/upcoming/sold_out) so the existing
-- MatchCtaButton component needs no changes. `active` is a separate
-- on/off switch — "is this match currently offered at all" is a different
-- question from "what's its sales status".
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.female_matches (
  id text primary key,
  home_team text not null,
  home_team_initial text not null,
  home_crest_url text,
  away_team text not null,
  away_team_initial text not null,
  away_crest_url text,
  match_date text not null,
  match_time text not null,
  stadium text not null,
  image_url text,
  description text,
  price integer not null default 0,
  status text not null default 'upcoming' check (status in ('available', 'upcoming', 'sold_out')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists female_matches_sort_order_idx on public.female_matches (sort_order);

alter table public.female_matches enable row level security;

drop policy if exists "female_matches_public_read" on public.female_matches;
create policy "female_matches_public_read" on public.female_matches
  for select using (true);

-- Reuses public.is_admin() (defined in 0002_admin_v2.sql) — same
-- admin-write model as matches/tiers/testimonials/hero_videos/site_settings.
drop policy if exists "female_matches_admin_write" on public.female_matches;
create policy "female_matches_admin_write" on public.female_matches
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- Additive, nullable link from the existing order tables — lets a women's
-- order live in the exact same sales/sale_items and wompi_orders/
-- wompi_order_items tables (their match_id/tier_id FKs to matches/tiers
-- are already nullable — see 0008/0016), while still being attributable
-- to a specific female match for admin reporting. Every existing row
-- defaults to NULL here; no existing data is touched.
-- =========================================================================

alter table public.sales
  add column if not exists female_match_id text references public.female_matches(id) on delete set null;

alter table public.wompi_orders
  add column if not exists female_match_id text references public.female_matches(id) on delete set null;

-- Seed: the first match, exactly as specified. price is in whole COP
-- pesos (same convention as tiers.price), not cents.
insert into public.female_matches (
  id, home_team, home_team_initial, away_team, away_team_initial,
  match_date, match_time, stadium, price, status, active, sort_order
)
values (
  'millonarios-vs-nacional-femenino',
  'Millonarios', 'M',
  'Nacional', 'N',
  'Por definir', 'Por definir', 'Estadio El Campín',
  15000, 'upcoming', true, 1
)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
