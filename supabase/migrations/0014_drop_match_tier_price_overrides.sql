-- Orgullo Embajador — remove per-match price overrides
--
-- Root cause of "price saved in the admin panel but the public site keeps
-- showing the old value": /admin/matches let you set a per-tier price
-- override on a single match (matches.tier_prices), and the checkout page
-- always preferred that override over the general price in
-- public.tiers/managed from /admin/precios. If a match had an override set,
-- editing the general price could never change what that match's checkout
-- showed — a second, hidden source of truth for price.
--
-- Fix: public.tiers (edited from /admin/precios) is now the single source
-- of truth for price, with no per-match override anywhere. The app code no
-- longer reads or writes tier_prices; this drops the now-dead column.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

alter table public.matches drop column if exists tier_prices;

notify pgrst, 'reload schema';
