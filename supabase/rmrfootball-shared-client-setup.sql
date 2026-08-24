-- Rocky Mountain Rams Football setup for the shared TeamAlum/HQ Supabase project.
-- Run this in the active shared Supabase SQL Editor after schema.sql and platform-expansion.sql.

insert into public.clients (
  id,
  name,
  site_variant,
  primary_domain,
  status,
  plan_key,
  subdomain,
  custom_domain,
  updated_at
) values (
  'rmrfootball',
  'Rocky Mountain Rams Football',
  'rmrfootball',
  'rmrfootball.teamalum.com',
  'active',
  'starter',
  'rmrfootball',
  null,
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  site_variant = excluded.site_variant,
  primary_domain = excluded.primary_domain,
  status = excluded.status,
  plan_key = excluded.plan_key,
  subdomain = excluded.subdomain,
  custom_domain = excluded.custom_domain,
  updated_at = now();

insert into public.crm_settings (
  client_id,
  id,
  annual_membership_amount_cents,
  membership_year_label,
  join_is_open,
  join_headline,
  join_body,
  updated_at
) values (
  'rmrfootball',
  'default',
  10000,
  'Rocky Mountain Rams Football Alumni & Boosters',
  true,
  'Support Rocky Mountain Rams Football',
  'Your gift helps Rocky Mountain Rams Football alumni, families, and boosters support the student-athletes carrying Rams pride forward.',
  now()
)
on conflict (client_id, id) do update
set
  annual_membership_amount_cents = excluded.annual_membership_amount_cents,
  membership_year_label = excluded.membership_year_label,
  join_is_open = excluded.join_is_open,
  join_headline = excluded.join_headline,
  join_body = excluded.join_body,
  updated_at = now();

insert into public.client_features (client_id, feature_key, is_enabled)
values
  ('rmrfootball', 'memberships', true),
  ('rmrfootball', 'sponsors', true),
  ('rmrfootball', 'events', true),
  ('rmrfootball', 'spotlights', true),
  ('rmrfootball', 'fundraising_campaigns', false),
  ('rmrfootball', 'broadcasts', false),
  ('rmrfootball', 'custom_domain', false),
  ('rmrfootball', 'stripe_connect', false)
on conflict (client_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.client_integrations (client_id, integration_key, status)
values
  ('rmrfootball', 'stripe_connect', 'connected'),
  ('rmrfootball', 'resend', 'not_connected'),
  ('rmrfootball', 'custom_domain', 'not_connected')
on conflict (client_id, integration_key) do update
set
  status = excluded.status,
  updated_at = now();

insert into public.site_sections (client_id, section_key, is_enabled, sort_order)
values
  ('rmrfootball', 'sponsors', true, 10),
  ('rmrfootball', 'fundraising_campaigns', false, 20),
  ('rmrfootball', 'spotlights', true, 30),
  ('rmrfootball', 'events', true, 40),
  ('rmrfootball', 'memberships', true, 50)
on conflict (client_id, section_key) do update
set
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order,
  updated_at = now();

notify pgrst, 'reload schema';
