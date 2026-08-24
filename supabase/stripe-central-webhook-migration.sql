-- TeamAlum central Stripe webhook support.
-- Run once in the shared Supabase SQL Editor before using one platform webhook.

alter table public.contacts
  add column if not exists stripe_account_id text;

create index if not exists contacts_stripe_customer_account_idx
  on public.contacts (stripe_customer_id, stripe_account_id)
  where stripe_customer_id is not null;

notify pgrst, 'reload schema';
