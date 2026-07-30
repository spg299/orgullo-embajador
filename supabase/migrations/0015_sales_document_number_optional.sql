-- Orgullo Embajador — simplify the public checkout form
--
-- "Número de documento" was removed from the public checkout form (buyer
-- form now only asks for full name, WhatsApp, email, confirm email, and
-- terms). New sales no longer send buyer_document_number, so the existing
-- not-null constraint would reject every new checkout with a 400 from
-- PostgREST. Made nullable instead of dropped — existing sales rows keep
-- their real historical document numbers.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

alter table public.sales alter column buyer_document_number drop not null;

notify pgrst, 'reload schema';
