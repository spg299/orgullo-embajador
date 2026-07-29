-- Orgullo Embajador — simplify sales status flow
--
-- Removes "en_proceso" and "entregada" as sale statuses. The flow is now
-- just: solicitud -> confirmada / cancelada. Ticket delivery is no longer
-- a status — it's tracked independently via the existing sales.delivered_at
-- column (already present since migration 0008), settable/unsettable from
-- the Ventas page without touching status.
--
-- Existing rows are migrated, not discarded: 'en_proceso' becomes
-- 'solicitud' (it was never confirmed), and 'entregada' becomes
-- 'confirmada' (its delivered_at, already set when it became "entregada"
-- under the old flow, is left untouched — no delivery history is lost).
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste
-- the SQL below (NOT this filename) > Run. Safe to re-run. Run AFTER 0001-0009.

-- 1. Drop the existing constraint FIRST (must happen before the UPDATEs
--    below, otherwise the old constraint rejects the very rows being
--    migrated into it — see the 0007 migration's history for why).
alter table public.sales drop constraint if exists sales_status_check;

-- 2. Migrate legacy statuses now that nothing enforces the old set
update public.sales set status = 'solicitud' where status = 'en_proceso';
update public.sales set status = 'confirmada' where status = 'entregada';

-- 3. Add the final constraint — every row is already valid at this point
alter table public.sales
  add constraint sales_status_check
  check (status in ('solicitud', 'confirmada', 'cancelada'));

-- 4. Force PostgREST schema-cache reload
notify pgrst, 'reload schema';
