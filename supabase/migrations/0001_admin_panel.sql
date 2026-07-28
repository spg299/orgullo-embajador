-- Orgullo Embajador — admin panel schema
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE / DROP..IF EXISTS.

-- =========================================================================
-- 1. profiles: auto-create on signup, with the admin-email exception
-- =========================================================================
-- Assumes the profiles table already exists with columns:
--   id uuid references auth.users, full_name text, email text, role text,
--   created_at timestamptz

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    case when new.email = 'spg29988@hotmail.com' then 'admin' else 'user' end,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- =========================================================================
-- 2. matches: single source of truth for every fixture (replaces the old
--    hardcoded homeMatches.ts array). Public can read; writes only happen
--    through the admin API routes using the service role key.
-- =========================================================================
create table if not exists public.matches (
  id text primary key,
  rival text not null,
  rival_initial text not null,
  rival_crest text,
  match_date text not null,
  match_time text not null,
  stadium text not null default 'Estadio El Campín',
  status text not null default 'upcoming' check (status in ('available', 'upcoming', 'sold_out')),
  buy_link text,
  show_in_hero boolean not null default true,
  tier_prices jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;

drop policy if exists "matches_public_read" on public.matches;
create policy "matches_public_read" on public.matches
  for select using (true);

-- Seed with the fixtures already live on the site, so migrating to the DB
-- doesn't lose anything. Safe to re-run (id is the primary key).
insert into public.matches (id, rival, rival_initial, rival_crest, match_date, match_time, stadium, status, sort_order)
values
  ('millonarios-vs-bucaramanga', 'Bucaramanga', 'B', '/images/crests/bucaramanga.png', 'Sábado, 25 de julio de 2026', '6:10 p.m.', 'Estadio El Campín', 'sold_out', 1),
  ('millonarios-vs-deportivo-pasto', 'Deportivo Pasto', 'DP', '/images/crests/deportivo-pasto.png', 'Martes, 4 de agosto de 2026', '8:20 p.m.', 'Estadio El Campín', 'available', 2),
  ('millonarios-vs-deportivo-cali', 'Deportivo Cali', 'DC', '/images/crests/deportivo-cali.png', 'Lunes, 17 de agosto de 2026', '6:10 p.m.', 'Estadio El Campín', 'upcoming', 3),
  ('millonarios-vs-inter-bogota', 'Inter de Bogotá', 'IB', '/images/crests/inter-bogota.png', 'Domingo, 30 de agosto de 2026', '6:15 p.m.', 'Estadio El Campín', 'upcoming', 4),
  ('millonarios-vs-boyaca-chico', 'Boyacá Chicó', 'BC', '/images/crests/boyaca-chico.jpeg', 'Sábado, 19 de septiembre de 2026', '8:15 p.m.', 'Estadio El Campín', 'upcoming', 5),
  ('millonarios-vs-once-caldas', 'Once Caldas', 'OC', '/images/crests/once-caldas.png', 'Martes, 13 de octubre de 2026', '8:00 p.m.', 'Estadio El Campín', 'upcoming', 6),
  ('millonarios-vs-jaguares', 'Jaguares', 'JG', '/images/crests/jaguares.webp', 'Sábado, 17 de octubre de 2026', '2:00 p.m.', 'Estadio El Campín', 'upcoming', 7),
  ('millonarios-vs-america-de-cali', 'América de Cali', 'AM', '/images/crests/america-cali.png', 'Lunes, 26 de octubre de 2026', '8:00 p.m.', 'Estadio El Campín', 'upcoming', 8),
  ('millonarios-vs-alianza-fc', 'Alianza FC', 'AF', '/images/crests/alianza-fc.jpeg', 'Domingo, 8 de noviembre de 2026', '3:30 p.m.', 'Estadio El Campín', 'upcoming', 9)
on conflict (id) do nothing;

-- =========================================================================
-- 3. testimonials
-- =========================================================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials
  for select using (active = true);

-- Storage bucket for testimonial photos (public read, admin-only write via
-- the service role key from the admin API routes).
insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do nothing;

drop policy if exists "testimonials_bucket_public_read" on storage.objects;
create policy "testimonials_bucket_public_read" on storage.objects
  for select using (bucket_id = 'testimonials');

-- =========================================================================
-- 4. hero_videos: background videos shown in the Hero crossfade
-- =========================================================================
create table if not exists public.hero_videos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.hero_videos enable row level security;

drop policy if exists "hero_videos_public_read" on public.hero_videos;
create policy "hero_videos_public_read" on public.hero_videos
  for select using (active = true);

-- Seed with the videos already live on the site.
insert into public.hero_videos (url, sort_order)
select v.url, v.sort_order
from (values
  ('/videos/hero-stadium.mp4', 1),
  ('/videos/pasion-1.mp4', 2),
  ('/videos/pasion-2.mp4', 3)
) as v(url, sort_order)
where not exists (select 1 from public.hero_videos);
