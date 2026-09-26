-- Approve Rocky Mountain Rams Football for launch on the shared TeamAlum platform.
-- Run this in the active shared Supabase SQL Editor.

update public.clients
set
  launch_approved_at = coalesce(launch_approved_at, now()),
  launch_review_requested_at = coalesce(launch_review_requested_at, now()),
  published_at = coalesce(published_at, now()),
  primary_domain = 'rmramsfootball.teamalum.com',
  subdomain = 'rmramsfootball',
  status = 'active',
  updated_at = now()
where id = 'rmrfootball'
   or id = 'rmramsfootball'
   or subdomain in ('rmrfootball', 'rmramsfootball')
   or primary_domain in (
     'rmrfootball.teamalum.com',
     'rmramsfootball.teamalum.com'
   );

select
  id,
  name,
  primary_domain,
  subdomain,
  launch_approved_at,
  published_at,
  status
from public.clients
where id = 'rmrfootball'
   or id = 'rmramsfootball'
   or subdomain = 'rmramsfootball'
   or primary_domain = 'rmramsfootball.teamalum.com';
