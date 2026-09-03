-- Orgullo Embajador — per-order access token for Wompi's public status routes
--
-- Security audit finding (MEDIO): /api/wompi/order-status and
-- /api/wompi/mark-redirected were reachable with only `reference`, which
-- has just ~32 bits of real randomness (a Date.now() prefix + 8 hex chars)
-- and is sent to Wompi's own checkout form — not a strong enough secret to
-- gate the buyer's own name/WhatsApp/email (embedded in the returned
-- whatsappUrl once an order is paid).
--
-- access_token is a separate, high-entropy (122-bit) secret that is never
-- sent to Wompi at all — it only ever travels inside our own redirect-url,
-- round-tripping through the buyer's own browser. Both routes now require
-- it to match before returning anything or accepting a write.
--
-- Nullable initially so this migration never fails on existing rows (there
-- should be none of consequence yet — Wompi went live very recently — but
-- this is non-destructive either way: old orders without a token simply
-- can no longer be polled/marked, which only matters for a payment that
-- was mid-flight at the exact moment this runs).
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

alter table public.wompi_orders add column if not exists access_token text;

create unique index if not exists wompi_orders_access_token_idx
  on public.wompi_orders (access_token)
  where access_token is not null;

notify pgrst, 'reload schema';
