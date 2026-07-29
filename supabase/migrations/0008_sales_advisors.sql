-- Orgullo Embajador — sales tracking + sales advisors
--
-- Introduces the first-ever "sale" concept in this project: until now the
-- public checkout flow only opened a WhatsApp link with a pre-filled
-- message and never wrote anything to the database. From now on, every
-- completed checkout creates a `sales` row (status 'solicitud') plus one
-- `sale_items` row per selected tier, so the admin panel can track a sale's
-- lifecycle (solicitud -> en_proceso -> confirmada -> entregada, or
-- cancelada), assign it to a sales advisor, and feed the executive
-- Dashboard's KPIs/charts with real data.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste
-- the SQL below (NOT this filename) > Run. Safe to re-run. Run AFTER 0001-0007.

-- =========================================================================
-- 1. advisors: sales advisors, manageable from Configuración
-- =========================================================================
create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  avatar_url text,
  color text not null default '#0f3fb0',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A profile can back at most one advisor row (this is how "Asignarme"
-- resolves the current admin's own advisor identity).
create unique index if not exists advisors_profile_id_key
  on public.advisors (profile_id)
  where profile_id is not null;

alter table public.advisors enable row level security;

-- =========================================================================
-- 2. sales: one row per completed public checkout ("solicitud")
-- =========================================================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  match_id text references public.matches(id) on delete set null,
  match_label text not null,
  buyer_full_name text not null,
  buyer_document_number text not null,
  buyer_whatsapp text not null,
  buyer_email text not null,
  status text not null default 'solicitud'
    check (status in ('solicitud', 'en_proceso', 'confirmada', 'entregada', 'cancelada')),
  advisor_id uuid references public.advisors(id) on delete set null,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_advisor_id_idx on public.sales (advisor_id);
create index if not exists sales_created_at_idx on public.sales (created_at);

alter table public.sales enable row level security;

-- =========================================================================
-- 3. sale_items: tier line items per sale (price/name snapshot, so later
--    edits to tiers.price/name never rewrite historical revenue charts)
-- =========================================================================
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  tier_id text references public.tiers(id) on delete set null,
  tier_name text not null,
  quantity integer not null,
  unit_price numeric not null
);

create index if not exists sale_items_sale_id_idx on public.sale_items (sale_id);

alter table public.sale_items enable row level security;

-- =========================================================================
-- RLS: deliberately no policies on advisors/sales/sale_items (default-deny
-- for anon AND authenticated). Unlike tiers/testimonials/matches, this data
-- is never shown on the public site, so there's no "_public_read" policy
-- to add here — every read and write, including the public checkout
-- insert, goes through server API routes using the service-role client
-- (which bypasses RLS entirely), exactly like /api/admin/users/list
-- already does for auth.users data that isn't safely client-readable.
-- =========================================================================

-- =========================================================================
-- 4. Storage bucket for advisor avatars (public read, admin-only write via
--    the service role key from the admin API routes).
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('advisors', 'advisors', true)
on conflict (id) do nothing;

drop policy if exists "advisors_bucket_public_read" on storage.objects;
create policy "advisors_bucket_public_read" on storage.objects
  for select using (bucket_id = 'advisors');

-- Force PostgREST to pick up the new tables/columns immediately.
notify pgrst, 'reload schema';
