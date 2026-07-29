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

-- 1. Migrate any legacy values to the 3 states the app uses today.
update public.tiers
set availability = 'disponible'
where availability in ('alta', 'media');

-- 2. Replace the check constraint with exactly the 3 allowed states —
--    drops whatever version currently exists (0002's original, 0004's
--    widened one, or none) and adds the final one.
alter table public.tiers drop constraint if exists tiers_availability_check;

alter table public.tiers
  add constraint tiers_availability_check
  check (availability in ('disponible', 'baja', 'agotado'));

-- 3. New rows should default to 'disponible', not the now-invalid 'alta'.
alter table public.tiers alter column availability set default 'disponible';

-- 4. Force PostgREST to pick up the constraint change immediately, so it
--    doesn't keep rejecting valid values while its schema cache is stale.
notify pgrst, 'reload schema';
