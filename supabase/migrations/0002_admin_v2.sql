-- Orgullo Embajador — admin panel v2 (roles, tiers, site settings, RLS)
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE / DROP..IF EXISTS.
-- Run AFTER 0001_admin_panel.sql.

-- =========================================================================
-- 1. Multiple initial admins, by email — replace the placeholders below with
--    the real addresses before running. Re-run any time you add/remove one;
--    it both fixes the signup trigger for FUTURE users and retroactively
--    promotes anyone who already registered with one of these emails.
-- =========================================================================
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
    case
      when new.email in (
        'spg29988@hotmail.com',
        'haroldortiz1925@gmail.com',
        'johnperdomo88@gmail.com',
        'edfabian95@gmail.com'
      ) then 'admin'
      else 'user'
    end,
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

-- Retroactively promote anyone who already registered with one of these
-- emails before this migration ran. Keep this list identical to the one
-- inside handle_new_user() above.
update public.profiles
set role = 'admin'
where email in (
  'spg29988@hotmail.com',
  'haroldortiz1925@gmail.com',
  'johnperdomo88@gmail.com',
  'edfabian95@gmail.com'
);

-- Make sure deleting a user from Auth also removes their profile row, so
-- "Eliminar usuario" from /admin/users can't leave an orphaned profile.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'profiles'
      and constraint_name = 'profiles_id_fkey'
  ) then
    alter table public.profiles drop constraint profiles_id_fkey;
  end if;
  alter table public.profiles
    add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
exception when others then
  -- If the profiles table uses a differently-named FK, this is a no-op;
  -- the /api/admin/users/delete route also deletes the profile row directly.
  null;
end $$;

-- =========================================================================
-- 2. matches: add description + a general banner image, used by /admin/matches
-- =========================================================================
alter table public.matches add column if not exists description text;
alter table public.matches add column if not exists image_url text;

-- =========================================================================
-- 3. tiers: ticket localidades/precios — replaces the hardcoded data/tiers.ts
-- =========================================================================
create table if not exists public.tiers (
  id text primary key,
  name text not null,
  description text not null default '',
  color text not null default '#0f3fb0',
  price integer not null default 0,
  availability text not null default 'alta' check (availability in ('alta', 'media', 'baja')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tiers enable row level security;

drop policy if exists "tiers_public_read" on public.tiers;
create policy "tiers_public_read" on public.tiers
  for select using (true);

insert into public.tiers (id, name, description, color, price, availability, sort_order)
values
  ('occidental-baja', 'Occidental Baja', 'Vista frontal, la más solicitada por la hinchada.', '#0f3fb0', 180000, 'media', 1),
  ('occidental-alta', 'Occidental Alta', 'Vista panorámica cubierta, excelente ángulo.', '#1a56d6', 140000, 'alta', 2),
  ('oriental', 'Oriental', 'Ambiente familiar, sol de la tarde.', '#cc9a2e', 120000, 'alta', 3),
  ('norte', 'Norte', 'La barra brava azul, pura pasión y color.', '#0a2f8c', 70000, 'baja', 4),
  ('sur', 'Sur', 'Hinchada visitante y ambiente popular.', '#4d7bea', 65000, 'alta', 5)
on conflict (id) do nothing;

-- =========================================================================
-- 4. site_settings: key/value store for editable site-wide content
--    (WhatsApp/Instagram/LinkedIn, copyright, contact info, Hero copy)
-- =========================================================================
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

insert into public.site_settings (key, value)
values
  ('whatsapp_number', '573186319954'),
  ('whatsapp_support_label', '+57 318 631 9954'),
  ('instagram_url', 'https://www.instagram.com/orgullo.embajador/?hl=es'),
  ('linkedin_url', 'https://www.linkedin.com/in/santiago-perdomo-gonzalez-68b4663b6/?locale=en'),
  ('copyright_text', '© 2026 Orgullo Embajador. Todos los derechos reservados.'),
  ('contact_address', 'Bogotá D.C., Colombia'),
  ('hero_headline', 'Compra tus boletas'),
  ('hero_subtext', 'Vive la pasión azul junto a Millonarios. Consigue tu puesto en El Campín en minutos.'),
  ('hero_button_label', 'Comprar ahora')
on conflict (key) do nothing;

-- =========================================================================
-- 5. Storage bucket for logos (site logo, Millonarios, rivals)
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_bucket_public_read" on storage.objects;
create policy "logos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'logos');

-- =========================================================================
-- 6. Role-based RLS: only admins may write, on top of the public-read
--    policies already in place. The app always writes through the
--    /api/admin/* routes using the service-role key (which bypasses RLS
--    entirely), so these are defense-in-depth — they make sure that even a
--    direct request using the public/publishable key can never insert,
--    update, or delete on these tables unless the caller is an admin.
-- =========================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array['matches', 'testimonials', 'hero_videos', 'tiers', 'site_settings'] loop
    execute format('drop policy if exists "%s_admin_write" on public.%I', t, t);
    execute format(
      'create policy "%s_admin_write" on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;
