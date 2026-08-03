-- TeamAlum multi-tenant migration
-- Run once on the shared Supabase project before pointing multiple sites at it.
-- Existing rows are assigned to the "colts" client by default.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id text primary key,
  name text not null,
  site_variant text not null,
  primary_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.clients (id, name, site_variant)
values
  ('colts', 'Swift Current Colts Football', 'colts'),
  ('demo', 'Northwest Yetis Demo', 'demo'),
  ('rmrfootball', 'Rocky Mountain Rams Football', 'rmrfootball'),
  ('bfbadgers', 'BF Badgers Football', 'bfbadgers')
on conflict (id) do update
set
  name = excluded.name,
  site_variant = excluded.site_variant,
  updated_at = now();

alter table public.contacts
  add column if not exists client_id text default 'colts';

update public.contacts
set client_id = 'colts'
where client_id is null;

alter table public.contacts
  alter column client_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contacts_client_id_fkey'
  ) then
    alter table public.contacts
      add constraint contacts_client_id_fkey
      foreign key (client_id)
      references public.clients(id);
  end if;
end $$;

drop index if exists public.contacts_email_unique_idx;
create unique index if not exists contacts_client_email_unique_idx
  on public.contacts (client_id, email);

create unique index if not exists contacts_client_id_id_unique_idx
  on public.contacts (client_id, id);

create index if not exists contacts_client_created_at_idx
  on public.contacts (client_id, created_at desc);

create index if not exists contacts_client_membership_status_idx
  on public.contacts (client_id, membership_status);

create index if not exists contacts_client_status_idx
  on public.contacts (client_id, status);

alter table public.crm_settings
  add column if not exists client_id text default 'colts';

update public.crm_settings
set client_id = 'colts'
where client_id is null;

alter table public.crm_settings
  alter column client_id set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'crm_settings_singleton'
  ) then
    alter table public.crm_settings
      drop constraint crm_settings_singleton;
  end if;

  if exists (
    select 1 from pg_constraint where conname = 'crm_settings_pkey'
  ) then
    alter table public.crm_settings
      drop constraint crm_settings_pkey;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'crm_settings_client_id_fkey'
  ) then
    alter table public.crm_settings
      add constraint crm_settings_client_id_fkey
      foreign key (client_id)
      references public.clients(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'crm_settings_default_id'
  ) then
    alter table public.crm_settings
      add constraint crm_settings_default_id
      check (id = 'default');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'crm_settings_pkey'
  ) then
    alter table public.crm_settings
      add constraint crm_settings_pkey
      primary key (client_id, id);
  end if;
end $$;

insert into public.crm_settings (client_id, id)
select clients.id, 'default'
from public.clients
on conflict (client_id, id) do nothing;

alter table public.contact_activities
  add column if not exists client_id text default 'colts';

update public.contact_activities
set client_id = contacts.client_id
from public.contacts
where contact_activities.contact_id = contacts.id;

alter table public.contact_activities
  alter column client_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contact_activities_client_id_fkey'
  ) then
    alter table public.contact_activities
      add constraint contact_activities_client_id_fkey
      foreign key (client_id)
      references public.clients(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_activities_client_contact_fk'
  ) then
    alter table public.contact_activities
      add constraint contact_activities_client_contact_fk
      foreign key (client_id, contact_id)
      references public.contacts(client_id, id)
      on delete cascade;
  end if;
end $$;

create index if not exists contact_activities_client_contact_created_idx
  on public.contact_activities (client_id, contact_id, created_at desc);

alter table public.campaigns
  add column if not exists client_id text default 'colts';

update public.campaigns
set client_id = 'colts'
where client_id is null;

alter table public.campaigns
  alter column client_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_client_id_fkey'
  ) then
    alter table public.campaigns
      add constraint campaigns_client_id_fkey
      foreign key (client_id)
      references public.clients(id);
  end if;
end $$;

create unique index if not exists campaigns_client_id_id_unique_idx
  on public.campaigns (client_id, id);

create index if not exists campaigns_client_updated_at_idx
  on public.campaigns (client_id, updated_at desc);

alter table public.campaign_blasts
  add column if not exists client_id text default 'colts';

update public.campaign_blasts
set client_id = campaigns.client_id
from public.campaigns
where campaign_blasts.campaign_id = campaigns.id;

alter table public.campaign_blasts
  alter column client_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaign_blasts_client_id_fkey'
  ) then
    alter table public.campaign_blasts
      add constraint campaign_blasts_client_id_fkey
      foreign key (client_id)
      references public.clients(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'campaign_blasts_client_campaign_fk'
  ) then
    alter table public.campaign_blasts
      add constraint campaign_blasts_client_campaign_fk
      foreign key (client_id, campaign_id)
      references public.campaigns(client_id, id)
      on delete cascade;
  end if;
end $$;

create unique index if not exists campaign_blasts_client_id_id_unique_idx
  on public.campaign_blasts (client_id, id);

create index if not exists campaign_blasts_client_campaign_updated_idx
  on public.campaign_blasts (client_id, campaign_id, updated_at desc);

alter table public.campaign_blast_events
  add column if not exists client_id text default 'colts';

update public.campaign_blast_events
set client_id = campaign_blasts.client_id
from public.campaign_blasts
where campaign_blast_events.blast_id = campaign_blasts.id;

alter table public.campaign_blast_events
  alter column client_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaign_blast_events_client_id_fkey'
  ) then
    alter table public.campaign_blast_events
      add constraint campaign_blast_events_client_id_fkey
      foreign key (client_id)
      references public.clients(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'campaign_blast_events_client_blast_fk'
  ) then
    alter table public.campaign_blast_events
      add constraint campaign_blast_events_client_blast_fk
      foreign key (client_id, blast_id)
      references public.campaign_blasts(client_id, id)
      on delete cascade;
  end if;
end $$;

create index if not exists campaign_blast_events_client_blast_created_idx
  on public.campaign_blast_events (client_id, blast_id, created_at desc);

alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.crm_settings enable row level security;
alter table public.contact_activities enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_blasts enable row level security;
alter table public.campaign_blast_events enable row level security;

drop policy if exists "Anyone can add contacts" on public.contacts;
drop policy if exists "Public can create contacts through scoped server payloads" on public.contacts;

notify pgrst, 'reload schema';
