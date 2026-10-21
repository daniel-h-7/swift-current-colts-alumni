-- READ ONLY. Run in HQ's Supabase SQL Editor, then in each legacy site's
-- Supabase project if different. Compare results privately; no secrets needed.
-- Requires the existing platform schema. No migration or launch approval occurs.
select
  c.id,
  c.name,
  c.site_variant,
  c.primary_domain,
  c.subdomain,
  c.status,
  c.launch_approved_at,
  c.published_at,
  (select count(*) from public.contacts x where x.client_id = c.id) as contacts,
  (select count(*) from public.campaigns x where x.client_id = c.id) as campaigns,
  (select count(*) from public.client_users x where x.client_id = c.id and x.role = 'owner') as owners,
  s.site_content is not null as has_saved_site_content,
  s.site_content::jsonb -> 'brand' ->> 'siteTitle' as saved_site_title,
  s.annual_membership_amount_cents,
  s.membership_year_label,
  i.status as stripe_connection_status,
  (i.external_account_id is not null and i.external_account_id like 'acct_%') as has_stripe_account_mapping
from public.clients c
left join public.crm_settings s on s.client_id = c.id and s.id = 'default'
left join public.client_integrations i on i.client_id = c.id and i.integration_key = 'stripe_connect'
where c.id in ('colts', 'sccoltsfootball', 'rmrfootball', 'rmramsfootball')
   or c.subdomain in ('sccoltsfootball', 'rmrfootball', 'rmramsfootball')
order by c.id;
