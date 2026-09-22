-- Orgullo Embajador — método de pago Nequi (verificación manual)
--
-- Nequi reutiliza las tablas sales/sale_items (el mismo camino que ya usa
-- WhatsApp directo) en lugar de crear una tabla nueva: es exactamente el
-- mismo modelo — una solicitud que un admin revisa y confirma manualmente
-- desde /admin/ventas — solo que ahora distinguible por payment_method, y
-- con un estado intermedio explícito ("pago_pendiente") para dejar clarísimo
-- que pulsar "Ya realicé el pago" NUNCA marca la venta como pagada por sí
-- solo. Wompi (wompi_orders) no se toca.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

-- 1. payment_method: separa Nequi de WhatsApp/manual dentro de la misma
--    tabla. Cerrado a estos dos valores porque son los únicos que esta
--    tabla puede contener hoy (Wompi vive en wompi_orders, aparte).
alter table public.sales
  add column if not exists payment_method text not null default 'whatsapp'
  check (payment_method in ('whatsapp', 'nequi'));

-- 2. confirmed_by: trazabilidad de qué admin confirmó el pago. Nullable —
--    ventas ya confirmadas antes de esta migración simplemente no tienen
--    este dato (no se puede reconstruir retroactivamente).
alter table public.sales
  add column if not exists confirmed_by uuid references public.profiles(id) on delete set null;

-- 3. Nuevo estado 'pago_pendiente' ("Pago pendiente de verificación"),
--    entre 'solicitud' y 'confirmada'. Aditivo: ninguna fila existente usa
--    este valor, así que no hace falta migrar datos, solo ampliar el check.
alter table public.sales drop constraint if exists sales_status_check;
alter table public.sales
  add constraint sales_status_check
  check (status in ('solicitud', 'pago_pendiente', 'confirmada', 'cancelada'));

notify pgrst, 'reload schema';
