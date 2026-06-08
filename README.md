This is the Next.js home for Swift Current Colts Football Alumni and Booster Club.

## CRM milestone

This first CRM milestone adds:

- A dedicated public `/join` page for alumni, booster, family, and supporter signups.
- Supabase client setup for server-side form inserts and dashboard reads.
- A password-protected `/admin` contacts dashboard.
- Filters for graduation year, relationship type, sport, email opt-in, and SMS opt-in.
- Duplicate handling by email address.
- Contact detail pages with status, membership status, tags, and admin notes.
- Protected CSV export.
- Search, sortable columns, membership filters, paid-through filters, and filtered CSV exports.
- CRM summary cards for contacts, membership health, and communication opt-ins.
- Admin-managed membership settings for annual amount, renewal deadline, join status, and join page copy.
- Stripe-ready membership fields for annual dues, paid-through dates, and future Stripe IDs.

Stripe is intentionally not included yet.

## Supabase environment variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
ADMIN_PASSWORD=choose-a-strong-admin-password
ADMIN_SESSION_SECRET=choose-a-long-random-session-secret
```

Add those same variables in Vercel under Project Settings, Environment Variables.

Use the Supabase publishable key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the Supabase service role key for `SUPABASE_SERVICE_ROLE_KEY`, and keep that key server-only. Do not expose the service role key in browser code.

## Supabase SQL table setup

Run this in the Supabase SQL editor:

```sql
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
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
  paid_through date,
  last_payment_at date,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists contacts_created_at_idx
  on public.contacts (created_at desc);

create index if not exists contacts_graduation_year_idx
  on public.contacts (graduation_year);

create index if not exists contacts_relationship_type_idx
  on public.contacts (relationship_type);

create index if not exists contacts_sport_idx
  on public.contacts (sport);

create unique index if not exists contacts_email_unique_idx
  on public.contacts (email);

create index if not exists contacts_status_idx
  on public.contacts (status);

alter table public.contacts enable row level security;

create policy "Anyone can add contacts"
  on public.contacts
  for insert
  to anon
  with check (true);

create policy "Anyone can read contacts for unprotected admin milestone"
  on public.contacts
  for select
  to anon
  using (true);
```

The app now protects `/admin` with `ADMIN_PASSWORD`, but the first milestone SQL kept read access open for quick setup. Once `SUPABASE_SERVICE_ROLE_KEY` is configured and the dashboard works, tighten the read policy:

```sql
drop policy if exists "Anyone can read contacts for unprotected admin milestone"
  on public.contacts;
```

The public join form inserts and updates through the app server. The unique email index lets repeat submissions update the existing contact instead of creating a duplicate.

Create the settings table for annual membership configuration:

```sql
create table if not exists public.crm_settings (
  id text primary key default 'default',
  annual_membership_amount_cents integer not null default 10000,
  membership_year_label text not null default '2026 Colts Football Alumni & Booster Club',
  renewal_deadline date,
  join_is_open boolean not null default true,
  join_headline text not null default 'Join the Colts network.',
  join_body text not null default 'One clean contact record helps the club reach alumni, families, boosters, and community supporters when it matters.',
  updated_at timestamptz not null default now(),
  constraint crm_settings_singleton check (id = 'default')
);

insert into public.crm_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.crm_settings enable row level security;
```

The app reads and writes `crm_settings` through the server using `SUPABASE_SERVICE_ROLE_KEY`, so no public settings policy is required.

For an existing table created before status and tags were added, run this migration:

```sql
alter table public.contacts
  add column if not exists status text not null default 'New',
  add column if not exists membership_status text not null default 'Not Started',
  add column if not exists tags text[] not null default '{}',
  add column if not exists admin_notes text,
  add column if not exists annual_dues_amount_cents integer,
  add column if not exists paid_through date,
  add column if not exists last_payment_at date,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_checkout_session_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'contacts_status_check'
  ) then
    alter table public.contacts
      add constraint contacts_status_check
      check (status in ('New', 'Active', 'Follow Up', 'Do Not Contact'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'contacts_membership_status_check'
  ) then
    alter table public.contacts
      add constraint contacts_membership_status_check
      check (
        membership_status in (
          'Not Started',
          'Pending Payment',
          'Active Member',
          'Expired'
        )
      );
  end if;
end $$;

create unique index if not exists contacts_email_unique_idx
  on public.contacts (email);

create index if not exists contacts_status_idx
  on public.contacts (status);
```

## Paid membership direction

The current `/join` page is free contact capture. The intended next evolution is annual paid membership:

- Show fixed annual membership donation tiers.
- Send users through Stripe Checkout before creating or activating a membership.
- Store Stripe customer, checkout session, annual dues amount, last payment, and paid-through fields on the contact record.
- Keep the contact dashboard as the club CRM for alumni, boosters, donors, and sponsors.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
