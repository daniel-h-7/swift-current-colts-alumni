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
- Contact activity timeline for admin updates, ready for future Stripe webhook events.
- Stripe-ready membership fields for annual dues, paid-through dates, and future Stripe IDs.
- Mock membership checkout flow that marks contacts Pending Payment, then Active Member for testing before Stripe is connected.
- Campaigns and draft email blasts with an email-width editor and metrics fields for future open/click tracking.

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
  gift_donation_amount_cents integer not null default 0,
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
  email_from_address text not null default 'onboarding@resend.dev',
  email_from_name text not null default 'Colts Alumni',
  email_reply_to text not null default '',
  email_sending_domain text not null default '',
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

If your `crm_settings` table already exists, run this migration:

```sql
alter table public.crm_settings
  add column if not exists email_from_address text not null default 'onboarding@resend.dev',
  add column if not exists email_from_name text not null default 'Colts Alumni',
  add column if not exists email_reply_to text not null default '',
  add column if not exists email_sending_domain text not null default '';

notify pgrst, 'reload schema';
```

Create the contact activity table:

```sql
create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  activity_type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists contact_activities_contact_created_idx
  on public.contact_activities (contact_id, created_at desc);

alter table public.contact_activities enable row level security;
```

The app writes and reads contact activity through the server using `SUPABASE_SERVICE_ROLE_KEY`. Later Stripe webhook events can insert payment and renewal activity into this same table.

For an existing table created before status and tags were added, run this migration:

```sql
alter table public.contacts
  add column if not exists status text not null default 'New',
  add column if not exists membership_status text not null default 'Not Started',
  add column if not exists tags text[] not null default '{}',
  add column if not exists admin_notes text,
  add column if not exists annual_dues_amount_cents integer,
  add column if not exists gift_donation_amount_cents integer not null default 0,
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

The `/join` page starts an annual membership checkout:

- The contact is created or updated.
- Membership status is set to `Pending Payment`.
- When `STRIPE_SECRET_KEY` is configured, the user is sent to Stripe Checkout for an annual subscription.
- When Stripe is not configured, the user is sent to `/membership/mock-checkout`.
- The Stripe webhook or mock completion button marks the contact as `Active Member`, sets `last_payment_at`, sets `paid_through`, and logs activity.

For Stripe sandbox demos:

```bash
STRIPE_SECRET_KEY=sk_test_your_sandbox_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_sandbox_webhook_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Create a local webhook endpoint with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

In Stripe, send these webhook events:

```text
checkout.session.completed
invoice.paid
```

Use Stripe test card `4242 4242 4242 4242` with any future expiry date, any CVC, and any postal code. Stripe creates an annual subscription for the membership. Any optional one-time gift is added to the initial invoice only.

For deployed Vercel previews, set `NEXT_PUBLIC_SITE_URL` to the preview URL and create a Stripe sandbox webhook endpoint that points to:

```text
https://your-preview-url.vercel.app/api/stripe/webhook
```

Store Stripe customer, checkout session, annual dues amount, last payment, and paid-through fields on the contact record. Keep the contact dashboard as the club CRM for alumni, boosters, donors, and sponsors.

After a Stripe or mock payment completes, the app runs the New Signups automation:

- It creates a `New Signups` campaign if one does not exist.
- It creates a default thank-you blast if the campaign has no blasts yet.
- Admins can edit that blast in the Campaigns section.
- New paid signups with email opt-in receive that blast automatically.
- SMS opt-ins are recorded as pending until an SMS provider is connected.

## Campaigns and blasts

Create the campaign tables:

```sql
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_blasts (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists campaign_blasts_campaign_updated_idx
  on public.campaign_blasts (campaign_id, updated_at desc);

create table if not exists public.campaign_blast_events (
  id uuid primary key default gen_random_uuid(),
  blast_id uuid not null references public.campaign_blasts(id) on delete cascade,
  event_type text not null,
  email text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists campaign_blast_events_blast_created_idx
  on public.campaign_blast_events (blast_id, created_at desc);

alter table public.campaigns enable row level security;
alter table public.campaign_blasts enable row level security;
alter table public.campaign_blast_events enable row level security;
```

The campaign module can create campaigns and blasts, filter audiences by graduation year, relationship type, sport, CRM status, membership status, paid-through state, opt-ins, and tags, and send real test emails through Resend when configured. Full audience sends are still intentionally disabled until deliverability, unsubscribe handling, and sender approval are ready.

## Email Provider Setup

Resend is the recommended starting provider for this project. It is the most cost-effective for the current stage because the free transactional tier includes 3,000 emails/month with a 100 emails/day limit, and the first paid transactional tier starts at $20/month for 50,000 emails/month. For comparison, Postmark's free tier is for testing with 100 emails/month and paid plans start at $15/month for 10,000 emails/month, while Mailgun's paid plans and overage model are less simple for this early CRM stage.

1. Create a Resend account.
2. Verify a sending domain in Resend.
3. Create an API key in Resend.
4. Add this Vercel Environment Variable:

```bash
RESEND_API_KEY=your-server-only-resend-api-key
```

Sender name, from email, reply-to email, and sending domain are managed inside `/admin/settings`. The from email must use a verified sending domain before production sends will work reliably. If your main domain is locked behind limited DNS management, use a separate sending domain with DNS you control.

For demos, test emails can be sent through an SMTP inbox instead of Resend by enabling SMTP demo mode:

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_DEMO_TO_EMAIL=optional-demo-inbox@example.com
```

`SMTP_DEMO_TO_EMAIL` is optional. When it is set, every campaign test email is redirected to that inbox while the original intended recipient is noted in the email body and send history. Use `SMTP_SECURE=true` for implicit TLS on port 465.

After adding or changing these variables in Vercel, redeploy the site. Locally, add the same values to `.env.local` and restart `npm run dev`.

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
