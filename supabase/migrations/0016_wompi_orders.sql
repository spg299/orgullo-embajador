-- Orgullo Embajador — Wompi Web Checkout (second payment method)
--
-- Adds card payments via Wompi's hosted Web Checkout, fully separate from
-- the existing WhatsApp flow (sales/sale_items are untouched — this is
-- additive, not a replacement). An order is inserted as 'pending_payment'
-- right before redirecting the buyer to Wompi, and is only ever moved to
-- 'paid'/'declined'/'voided'/'error' by the server-side webhook handler
-- after verifying Wompi's signature — never by the buyer's browser
-- returning from the redirect.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.wompi_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  match_id text references public.matches(id) on delete set null,
  match_label text not null,
  buyer_full_name text not null,
  buyer_email text not null,
  buyer_whatsapp text not null,
  subtotal numeric not null default 0,
  processing_fee numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'COP',
  payment_method text not null default 'WOMPI',
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'declined', 'voided', 'error')),
  wompi_transaction_id text,
  wompi_status text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wompi_orders_status_idx on public.wompi_orders (status);
create index if not exists wompi_orders_reference_idx on public.wompi_orders (reference);
create index if not exists wompi_orders_created_at_idx on public.wompi_orders (created_at);

alter table public.wompi_orders enable row level security;

-- Line items per order (price/name snapshot, same reasoning as sale_items:
-- a later tiers.price edit must never rewrite historical revenue).
create table if not exists public.wompi_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.wompi_orders(id) on delete cascade,
  tier_id text references public.tiers(id) on delete set null,
  tier_name text not null,
  quantity integer not null,
  unit_price numeric not null
);

create index if not exists wompi_order_items_order_id_idx on public.wompi_order_items (order_id);

alter table public.wompi_order_items enable row level security;

-- RLS: deliberately no policies on either table (default-deny for anon AND
-- authenticated), identical reasoning to sales/sale_items/admin_access_logs
-- — buyer PII and payment amounts live here, so every read and write goes
-- through a server API route on the service-role client. The one public
-- read (the post-payment result page polling its own order's status) goes
-- through its own narrow API route that hand-picks non-sensitive fields —
-- never a direct table read from the browser.
