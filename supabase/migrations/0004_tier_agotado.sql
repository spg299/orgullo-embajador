-- Orgullo Embajador — add "agotado" (sold out) as a valid tier availability
--
-- 0002_admin_v2.sql created public.tiers.availability with a check
-- constraint limited to ('alta', 'media', 'baja'). The admin panel now lets
-- staff mark a localidad as sold out, so the constraint must accept
-- 'agotado' too or every save/insert with that value will be rejected by
-- Postgres.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste >
-- Run. Safe to re-run. Run AFTER 0001-0003.

alter table public.tiers drop constraint if exists tiers_availability_check;

alter table public.tiers
  add constraint tiers_availability_check
  check (availability in ('alta', 'media', 'baja', 'agotado'));
