-- Orgullo Embajador — finalize tiers.availability to exactly 3 states
--
-- 0004_tier_agotado.sql and 0005_tier_availability_simplify.sql were
-- written to move tiers.availability from the original ('alta', 'media',
-- 'baja') set to the final ('disponible', 'baja', 'agotado') set the app
-- code actually uses, but neither was ever applied to the live database —
-- the check constraint is still the very first one from 0002_admin_v2.sql
-- (only 'alta'/'media'/'baja' allowed), which is why saving a tier as
-- "Agotado" (or "Disponible") fails with:
--   new row for relation "tiers" violates check constraint
--   "tiers_availability_check"
--
-- This migration is a self-contained catch-up: safe to run no matter which
-- of 0004/0005 (if any) already partially succeeded. Run this once in the
-- Supabase dashboard: SQL Editor > New query > paste > Run.

-- 1. Drop the existing constraint FIRST — whatever version currently
--    exists (0002's original 'alta'/'media'/'baja', 0004's widened one
--    that adds 'agotado', or none). The data migration below sets rows to
--    'disponible', which the old constraint doesn't allow; the column must
--    be unconstrained before that UPDATE runs, or Postgres validates the
--    new value against the still-active old constraint and rejects it —
--    exactly the "violates check constraint" error this migration is
--    fixing.
alter table public.tiers drop constraint if exists tiers_availability_check;

-- 2. Now that nothing is enforcing the old set, migrate legacy values to
--    the 3 states the app uses today.
update public.tiers
set availability = 'disponible'
where availability in ('alta', 'media');

-- 3. Add the final constraint — every row is already valid at this point.
alter table public.tiers
  add constraint tiers_availability_check
  check (availability in ('disponible', 'baja', 'agotado'));

-- 4. New rows should default to 'disponible', not the now-invalid 'alta'.
alter table public.tiers alter column availability set default 'disponible';

-- 5. Force PostgREST to pick up the constraint change immediately, so it
--    doesn't keep rejecting valid values while its schema cache is stale.
notify pgrst, 'reload schema';
