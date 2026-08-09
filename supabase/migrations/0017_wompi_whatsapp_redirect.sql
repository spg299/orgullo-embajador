-- Orgullo Embajador — track the auto-redirect to WhatsApp after an
-- APPROVED Wompi payment, so a page reload of /comprar/resultado never
-- re-triggers it. Set exactly once, only for orders the webhook already
-- marked 'paid' (see /api/wompi/mark-redirected).
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

alter table public.wompi_orders add column if not exists whatsapp_redirected_at timestamptz;

notify pgrst, 'reload schema';
