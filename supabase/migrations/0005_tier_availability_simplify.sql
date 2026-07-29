-- Orgullo Embajador — simplify tier availability to 3 real-world states
--
-- The admin panel previously exposed 4 availability levels ('alta', 'media',
-- 'baja', 'agotado'), but Orgullo Embajador only actually distinguishes
-- three: available, almost sold out, and sold out. 'alta' and 'media' are
-- merged into a single 'disponible' state; 'baja' (Últimas boletas) and
-- 'agotado' are unchanged.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste >
-- Run. Safe to re-run. Run AFTER 0001-0004.

-- 1. Migrate existing rows before the constraint is tightened, or the
--    update below would be rejected by the old check.
update public.tiers
set availability = 'disponible'
where availability in ('alta', 'media');

-- 2. Replace the check constraint (added by 0002, widened by 0004) with one
--    that only allows the 3 states the admin UI now offers.
alter table public.tiers drop constraint if exists tiers_availability_check;

alter table public.tiers
  add constraint tiers_availability_check
  check (availability in ('disponible', 'baja', 'agotado'));

-- 3. New rows should default to 'disponible', not the now-invalid 'alta'.
alter table public.tiers alter column availability set default 'disponible';
