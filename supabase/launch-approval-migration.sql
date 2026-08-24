-- TeamAlum launch approval gate.
-- Run once in the shared Supabase SQL Editor.

alter table public.clients
  add column if not exists launch_approved_at timestamptz;

-- Existing intentionally published clients can be approved in HQ.
-- Leave null to keep public pages parked until TeamAlum approves launch.

notify pgrst, 'reload schema';
