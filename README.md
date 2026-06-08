This is the Next.js home for Swift Current Colts Football Alumni and Booster Club.

## CRM milestone

This first CRM milestone adds:

- A dedicated public `/join` page for alumni, booster, family, and supporter signups.
- Supabase client setup for server-side form inserts and dashboard reads.
- An unprotected `/admin` contacts dashboard.
- Filters for graduation year, relationship type, sport, email opt-in, and SMS opt-in.

Stripe is intentionally not included yet.

## Supabase environment variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://njdqzdqlrzlziejlskar.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_58f3JENxdSRYpLXicCWC0Q_6XVtUFl-
```

Add those same variables in Vercel under Project Settings, Environment Variables.

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

The read policy is intentionally open because `/admin` is unprotected for this milestone. Replace it when authentication is added.

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
