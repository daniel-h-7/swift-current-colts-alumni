-- TeamAlum shared Supabase: new client setup template
-- Run this after supabase/multi-tenant-migration.sql has already been run once.
-- Replace the values in the "new_client" CTE before running.

with new_client as (
  select
    'newclient'::text as id,
    'New Client Football'::text as name,
    'newclient'::text as site_variant,
    'newclient.teamalum.com'::text as primary_domain
)
insert into public.clients (id, name, site_variant, primary_domain)
select id, name, site_variant, primary_domain
from new_client
on conflict (id) do update
set
  name = excluded.name,
  site_variant = excluded.site_variant,
  primary_domain = excluded.primary_domain,
  updated_at = now();

with new_client as (
  select 'newclient'::text as id
)
insert into public.crm_settings (client_id, id)
select id, 'default'
from new_client
on conflict (client_id, id) do nothing;

notify pgrst, 'reload schema';
