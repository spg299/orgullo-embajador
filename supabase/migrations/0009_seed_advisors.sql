-- Orgullo Embajador — seed initial sales advisors
--
-- Adds the first 4 sales advisors as real rows in public.advisors (the
-- table already built in migration 0008 and managed from Configuración →
-- Asesores de ventas). The Ventas page's advisor selector already reads
-- this table dynamically, so no app code changes are needed — these rows
-- simply populate what was an empty list. Each can be edited, deactivated,
-- or linked to a login (for "Asignarme") from Configuración at any time.
--
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste
-- the SQL below (NOT this filename) > Run. Safe to re-run (skips names
-- that already exist). Run AFTER 0001-0008.

insert into public.advisors (name, color, active)
select v.name, v.color, true
from (values
  ('Edward Ortiz', '#0f3fb0'),
  ('Harold Ortiz', '#1a56d6'),
  ('Jhon Perdomo', '#cc9a2e'),
  ('Santiago Perdomo', '#059669')
) as v(name, color)
where not exists (select 1 from public.advisors where name = v.name);

notify pgrst, 'reload schema';
