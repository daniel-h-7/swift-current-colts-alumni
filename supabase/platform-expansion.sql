-- TeamAlum platform expansion
-- Run after supabase/schema.sql or supabase/multi-tenant-migration.sql.
-- Adds the platform concepts needed for HQ + Studio + published client sites.

alter table public.clients
  add column if not exists status text not null default 'active',
  add column if not exists plan_key text not null default 'starter',
  add column if not exists subdomain text,
  add column if not exists custom_domain text,
  add column if not exists support_notes text,
  add column if not exists launch_approved_at timestamptz,
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clients_status_check'
  ) then
    alter table public.clients
      add constraint clients_status_check
      check (status in ('trial', 'active', 'paused', 'archived'));
  end if;
end $$;

create unique index if not exists clients_subdomain_unique_idx
  on public.clients (subdomain)
  where subdomain is not null;

create unique index if not exists clients_custom_domain_unique_idx
  on public.clients (custom_domain)
  where custom_domain is not null;

create table if not exists public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  auth_user_id uuid not null,
  email text not null,
  full_name text,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, auth_user_id),
  unique (client_id, email),
  constraint client_users_role_check check (
    role in ('owner', 'admin', 'editor', 'viewer')
  )
);

create index if not exists client_users_auth_user_idx
  on public.client_users (auth_user_id);

create table if not exists public.client_features (
  client_id text not null references public.clients(id) on delete cascade,
  feature_key text not null,
  is_enabled boolean not null default false,
  configured_by text,
  updated_at timestamptz not null default now(),
  primary key (client_id, feature_key),
  constraint client_features_key_check check (
    feature_key in (
      'memberships',
      'sponsors',
      'events',
      'spotlights',
      'fundraising_campaigns',
      'broadcasts',
      'custom_domain',
      'stripe_connect'
    )
  )
);

insert into public.client_features (client_id, feature_key, is_enabled)
select clients.id, feature.feature_key, feature.is_enabled
from public.clients
cross join (
  values
    ('memberships', true),
    ('sponsors', true),
    ('events', true),
    ('spotlights', true),
    ('fundraising_campaigns', false),
    ('broadcasts', false),
    ('custom_domain', false),
    ('stripe_connect', false)
) as feature(feature_key, is_enabled)
on conflict (client_id, feature_key) do nothing;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  bucket text not null default 'client-assets',
  storage_path text not null,
  public_url text,
  asset_type text not null default 'image',
  alt_text text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, storage_path),
  constraint media_assets_asset_type_check check (
    asset_type in ('logo', 'hero_image', 'sponsor_logo', 'spotlight_photo', 'image', 'document')
  )
);

create index if not exists media_assets_client_type_idx
  on public.media_assets (client_id, asset_type, created_at desc);

create table if not exists public.client_integrations (
  client_id text not null references public.clients(id) on delete cascade,
  integration_key text not null,
  status text not null default 'not_connected',
  external_account_id text,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (client_id, integration_key),
  constraint client_integrations_key_check check (
    integration_key in ('stripe_connect', 'resend', 'custom_domain')
  ),
  constraint client_integrations_status_check check (
    status in ('not_connected', 'pending', 'connected', 'needs_attention', 'disabled')
  )
);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  section_key text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (client_id, section_key)
);

create index if not exists site_sections_client_order_idx
  on public.site_sections (client_id, sort_order, section_key);

alter table public.client_users enable row level security;
alter table public.client_features enable row level security;
alter table public.media_assets enable row level security;
alter table public.client_integrations enable row level security;
alter table public.site_sections enable row level security;

notify pgrst, 'reload schema';
