-- TeamAlum launch review workflow.
-- Run once in the shared Supabase SQL Editor.

alter table public.clients
  add column if not exists launch_review_requested_at timestamptz,
  add column if not exists launch_approved_at timestamptz;

notify pgrst, 'reload schema';
