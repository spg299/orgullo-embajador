-- Orgullo Embajador — close the self-promotion hole in profiles RLS
--
-- Security audit finding (CRÍTICO): "profiles_update_own" (0001_admin_panel.sql,
-- reaffirmed identically in 0003_sync_profiles.sql) is `for update using
-- (auth.uid() = id)` with NO `with check`. Postgres reuses `using` as the
-- check for the post-update row when `with check` is omitted — and
-- `auth.uid() = id` stays true no matter what else changes in the same
-- UPDATE, including `role`. Any authenticated user can currently call the
-- Supabase REST API directly (their own publishable key + their own JWT,
-- bypassing this app entirely) and set their own role to 'admin'. Since
-- verifyAdmin() and is_admin() both trust profiles.role read live from the
-- DB, this is a full admin-panel + financial-data takeover from a plain
-- signup, with zero code path in this app involved.
--
-- Fix: `current_profile_role()` (security definer, bypasses RLS so it can't
-- recurse/be blocked by the very policy it supports) reads the role
-- currently stored for the caller. The new `with check` requires the
-- post-update row's `role` to equal that — i.e. an UPDATE that doesn't
-- touch `role` always passes (full_name/email edits keep working exactly
-- as before), but any UPDATE that tries to *change* `role` is rejected by
-- Postgres before it's ever written. This does not depend on the app
-- hiding a button or checking anything client-side.
--
-- Legitimate role changes still go through POST /api/admin/users/update-role,
-- which uses getSupabaseAdmin() (the service-role client bypasses RLS
-- entirely) — that flow is untouched and keeps working exactly as before.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create or replace function public.current_profile_role()
returns text
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_profile_role());

notify pgrst, 'reload schema';

-- =========================================================================
-- READ-ONLY AUDIT QUERY — run separately, does not modify anything.
-- Lists everyone currently marked as admin, so you can confirm the list
-- matches who you actually expect (and catch it now if this hole was
-- already used before this migration closed it).
-- =========================================================================
-- select id, email, role from public.profiles where role = 'admin' order by email;
