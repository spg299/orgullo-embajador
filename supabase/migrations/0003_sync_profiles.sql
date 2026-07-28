-- Orgullo Embajador — sync public.profiles with auth.users
--
-- Root cause of /admin returning 403 for every user, including real admins:
-- handle_new_user() is a trigger that only fires on NEW inserts into
-- auth.users. Accounts that registered before the trigger existed (or
-- before it was correctly installed by 0002_admin_v2.sql) never got a row
-- inserted into public.profiles — a trigger can't retroactively backfill
-- rows that already existed. Both verifyAdmin() (src/lib/supabase/adminGuard.ts)
-- and AuthContext (src/contexts/AuthContext.tsx) look a user up by id in
-- profiles, so with no row, everyone — including admins — is treated as a
-- plain logged-out visitor.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to re-run. Run AFTER 0001_admin_panel.sql and 0002_admin_v2.sql.

-- =========================================================================
-- 1. Re-affirm the trigger (identical to 0002_admin_v2.sql) — belt and
--    suspenders in case it was ever dropped, or never successfully created.
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

-- =========================================================================
-- 2. Backfill: insert a profiles row for every auth.users row that doesn't
--    have one yet, preserving the same UUID (id). This is what actually
--    fixes the 403 for every account that registered before the trigger
--    was correctly in place.
-- =========================================================================
insert into public.profiles (id, full_name, email, role, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  u.email,
  case
    when u.email in (
      'spg29988@hotmail.com',
      'haroldortiz1925@gmail.com',
      'johnperdomo88@gmail.com',
      'edfabian95@gmail.com'
    ) then 'admin'
    else 'user'
  end,
  u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =========================================================================
-- 3. Retroactively promote the admin emails even if their profile row
--    already existed with role='user' (e.g. inserted by hand, or by an
--    earlier trigger run before the admin list was correct).
-- =========================================================================
update public.profiles
set role = 'admin'
where email in (
  'spg29988@hotmail.com',
  'haroldortiz1925@gmail.com',
  'johnperdomo88@gmail.com',
  'edfabian95@gmail.com'
);

-- =========================================================================
-- 4. RLS sanity check: profiles must stay readable by the row owner (so
--    AuthContext can resolve isAdmin client-side) and writable only by the
--    owner for their own row — re-affirmed here in case an earlier partial
--    migration run left this in a different state.
-- =========================================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
