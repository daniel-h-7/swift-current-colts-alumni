-- TeamAlum fresh Supabase setup
-- Run this first in Supabase SQL Editor for every new client/demo project.

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

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default 'colts' references public.clients(id),
  first_name text not null,
  last_name text not null,
  email text not null,
  alternate_email text,
  phone text,
  graduation_year integer,
  relationship_type text not null check (
    relationship_type in (
      'Alumni',
      'Parent / Guardian',
      'Booster',
      'Coach / Staff',
      'Community Supporter',
      'Student Athlete'
    )
  ),
  sport text not null check (
    sport in (
      'Football',
      'Cheer',
      'Band',
      'Athletics Support',
      'Other'
    )
  ),
  email_opt_in boolean not null default true,
  sms_opt_in boolean not null default false,
  notes text,
  status text not null default 'New' check (
    status in (
      'New',
      'Active',
      'Follow Up',
      'Do Not Contact'
    )
  ),
  membership_status text not null default 'Not Started' check (
    membership_status in (
      'Not Started',
      'Pending Payment',
      'Active Member',
      'Expired'
    )
  ),
  tags text[] not null default '{}',
  admin_notes text,
  annual_dues_amount_cents integer,
  gift_donation_amount_cents integer not null default 0,
  paid_through date,
  last_payment_at date,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists contacts_email_unique_idx
  on public.contacts (client_id, email);

create unique index if not exists contacts_client_id_id_unique_idx
  on public.contacts (client_id, id);

create index if not exists contacts_created_at_idx
  on public.contacts (client_id, created_at desc);

create index if not exists contacts_graduation_year_idx
  on public.contacts (client_id, graduation_year);

create index if not exists contacts_relationship_type_idx
  on public.contacts (client_id, relationship_type);

create index if not exists contacts_sport_idx
  on public.contacts (client_id, sport);

create index if not exists contacts_status_idx
  on public.contacts (client_id, status);

create index if not exists contacts_membership_status_idx
  on public.contacts (client_id, membership_status);

alter table public.contacts enable row level security;

drop policy if exists "Anyone can add contacts" on public.contacts;
drop policy if exists "Public can create contacts through scoped server payloads" on public.contacts;

create table if not exists public.crm_settings (
  client_id text not null default 'colts' references public.clients(id),
  id text not null default 'default',
  annual_membership_amount_cents integer not null default 10000,
  email_from_address text not null default 'onboarding@resend.dev',
  email_from_name text not null default 'TeamAlum',
  email_reply_to text not null default '',
  email_sending_domain text not null default '',
  membership_year_label text not null default 'Annual Football Alumni and Booster Club',
  renewal_deadline date,
  site_content jsonb,
  join_is_open boolean not null default true,
  join_headline text not null default 'Help build the legacy.',
  join_body text not null default 'Your gift today helps ensure student-athletes have the necessary tools to succeed on and off the football field.',
  updated_at timestamptz not null default now(),
  primary key (client_id, id),
  constraint crm_settings_default_id check (id = 'default')
);

create unique index if not exists crm_settings_client_id_id_unique_idx
  on public.crm_settings (client_id, id);

insert into public.crm_settings (id, client_id)
select 'default', clients.id
from public.clients
on conflict (client_id, id) do nothing;

alter table public.crm_settings enable row level security;

create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default 'colts' references public.clients(id),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  activity_type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.contact_activities
  add constraint contact_activities_client_contact_fk
  foreign key (client_id, contact_id)
  references public.contacts(client_id, id)
  on delete cascade;

create index if not exists contact_activities_contact_created_idx
  on public.contact_activities (client_id, contact_id, created_at desc);

alter table public.contact_activities enable row level security;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default 'colts' references public.clients(id),
  title text not null,
  description text,
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists campaigns_client_id_id_unique_idx
  on public.campaigns (client_id, id);

create index if not exists campaigns_updated_at_idx
  on public.campaigns (client_id, updated_at desc);

alter table public.campaigns enable row level security;

create table if not exists public.campaign_blasts (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default 'colts' references public.clients(id),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  subject text not null,
  preheader text,
  html_content text not null,
  status text not null default 'Draft' check (status in ('Draft', 'Scheduled', 'Sent')),
  audience_filter text,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  open_count integer not null default 0,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists campaign_blasts_client_id_id_unique_idx
  on public.campaign_blasts (client_id, id);

alter table public.campaign_blasts
  add constraint campaign_blasts_client_campaign_fk
  foreign key (client_id, campaign_id)
  references public.campaigns(client_id, id)
  on delete cascade;

create index if not exists campaign_blasts_campaign_updated_idx
  on public.campaign_blasts (client_id, campaign_id, updated_at desc);

alter table public.campaign_blasts enable row level security;

create table if not exists public.campaign_blast_events (
  id uuid primary key default gen_random_uuid(),
  client_id text not null default 'colts' references public.clients(id),
  blast_id uuid not null references public.campaign_blasts(id) on delete cascade,
  event_type text not null,
  email text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.campaign_blast_events
  add constraint campaign_blast_events_client_blast_fk
  foreign key (client_id, blast_id)
  references public.campaign_blasts(client_id, id)
  on delete cascade;

create index if not exists campaign_blast_events_blast_created_idx
  on public.campaign_blast_events (client_id, blast_id, created_at desc);

alter table public.campaign_blast_events enable row level security;

notify pgrst, 'reload schema';
