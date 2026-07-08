-- Optional TeamAlum demo data
-- Run this after schema.sql when you want a clean fake demo CRM.

delete from public.campaign_blast_events
where metadata->>'source' = 'demo-seed';

delete from public.contact_activities
where metadata->>'source' = 'demo-seed';

insert into public.contacts (
  first_name,
  last_name,
  email,
  alternate_email,
  phone,
  graduation_year,
  relationship_type,
  sport,
  email_opt_in,
  sms_opt_in,
  notes,
  status,
  membership_status,
  tags,
  admin_notes,
  annual_dues_amount_cents,
  gift_donation_amount_cents,
  paid_through,
  last_payment_at,
  created_at
) values
  ('Jordan', 'Miller', 'jordan.miller@example.com', 'jmiller.alumni@example.com', '555-0101', 2004, 'Alumni', 'Football', true, true, 'Former captain and sponsor prospect.', 'Active', 'Active Member', array['captain','sponsor-prospect'], 'Ask about banquet sponsorship.', 5000, 25000, current_date + interval '8 months', current_date - interval '4 months', now() - interval '42 days'),
  ('Marcus', 'Reed', 'marcus.reed@example.com', null, '555-0102', 2011, 'Alumni', 'Football', true, false, 'Interested in mentoring current players.', 'Active', 'Active Member', array['mentor'], 'Strong contact for alumni night.', 5000, 10000, current_date + interval '10 months', current_date - interval '2 months', now() - interval '36 days'),
  ('Taylor', 'Brooks', 'taylor.brooks@example.com', null, '555-0103', null, 'Parent / Guardian', 'Football', true, true, 'Parent volunteer.', 'Follow Up', 'Pending Payment', array['parent','volunteer'], 'Follow up on payment completion.', 5000, 0, null, null, now() - interval '30 days'),
  ('Avery', 'Johnson', 'avery.johnson@example.com', null, '555-0104', 1998, 'Alumni', 'Football', true, false, 'Potential golf tournament committee member.', 'Active', 'Active Member', array['committee'], '', 5000, 20000, current_date + interval '6 months', current_date - interval '6 months', now() - interval '26 days'),
  ('Chris', 'Anderson', 'chris.anderson@example.com', null, '555-0105', null, 'Community Supporter', 'Football', true, false, 'Local business owner.', 'Active', 'Not Started', array['business'], 'Could become a sponsor.', null, 0, null, null, now() - interval '20 days'),
  ('Dylan', 'Parker', 'dylan.parker@example.com', null, '555-0106', 2022, 'Alumni', 'Football', true, true, 'Recent grad, social media friendly.', 'New', 'Not Started', array['recent-grad'], '', null, 0, null, null, now() - interval '16 days'),
  ('Morgan', 'Lewis', 'morgan.lewis@example.com', null, '555-0107', null, 'Booster', 'Football', true, false, 'Booster club donor.', 'Active', 'Active Member', array['booster'], '', 5000, 50000, current_date + interval '11 months', current_date - interval '1 month', now() - interval '12 days'),
  ('Casey', 'Wright', 'casey.wright@example.com', null, '555-0108', 2017, 'Alumni', 'Football', false, false, 'Asked not to receive email blasts.', 'Do Not Contact', 'Expired', array['opt-out'], 'Do not include in campaign sends.', 5000, 0, current_date - interval '2 months', current_date - interval '14 months', now() - interval '9 days'),
  ('Sam', 'Carter', 'sam.carter@example.com', null, '555-0109', null, 'Coach / Staff', 'Football', true, true, 'Staff contact for alumni weekend.', 'Active', 'Not Started', array['staff'], '', null, 0, null, null, now() - interval '5 days'),
  ('Riley', 'Stone', 'riley.stone@example.com', null, '555-0110', 2009, 'Alumni', 'Football', true, true, 'Very engaged alumni supporter.', 'Active', 'Active Member', array['alumni-night'], '', 5000, 15000, current_date + interval '9 months', current_date - interval '3 months', now() - interval '2 days')
on conflict (email) do update set
  alternate_email = excluded.alternate_email,
  phone = excluded.phone,
  graduation_year = excluded.graduation_year,
  relationship_type = excluded.relationship_type,
  sport = excluded.sport,
  email_opt_in = excluded.email_opt_in,
  sms_opt_in = excluded.sms_opt_in,
  notes = excluded.notes,
  status = excluded.status,
  membership_status = excluded.membership_status,
  tags = excluded.tags,
  admin_notes = excluded.admin_notes,
  annual_dues_amount_cents = excluded.annual_dues_amount_cents,
  gift_donation_amount_cents = excluded.gift_donation_amount_cents,
  paid_through = excluded.paid_through,
  last_payment_at = excluded.last_payment_at;

insert into public.campaigns (
  id,
  title,
  description,
  status,
  created_at,
  updated_at
) values
  ('11111111-1111-4111-8111-111111111111', 'New Signups', 'Automatic thank-you message for new paid members.', 'Active', now() - interval '25 days', now() - interval '3 days'),
  ('22222222-2222-4222-8222-222222222222', 'Alumni Weekend 2026', 'Seasonal campaign for homecoming, alumni night, and program updates.', 'Active', now() - interval '18 days', now() - interval '2 days'),
  ('33333333-3333-4333-8333-333333333333', 'Sponsor Drive', 'Outreach for local sponsors and major supporters.', 'Draft', now() - interval '12 days', now() - interval '1 day')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  updated_at = excluded.updated_at;

insert into public.campaign_blasts (
  id,
  campaign_id,
  title,
  subject,
  preheader,
  html_content,
  status,
  audience_filter,
  sent_at,
  recipient_count,
  open_count,
  click_count,
  created_at,
  updated_at
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Welcome Thank You',
    'Thank you for supporting Team Gridiron',
    'Your support helps build the next generation.',
    '<h1>Thank you for your support!</h1><p>Your annual membership helps provide student-athletes with the tools, experiences, and support they need to succeed on and off the field.</p>',
    'Sent',
    '{"membershipStatus":"Active Member","emailOptIn":"true"}',
    now() - interval '2 days',
    6,
    4,
    2,
    now() - interval '24 days',
    now() - interval '2 days'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Homecoming Save the Date',
    'Alumni Weekend is coming',
    'Join alumni, boosters, and families under the lights.',
    '<h1>Alumni Weekend is coming</h1><p>We would love to see you back under the lights for a night celebrating the program and the people who built it.</p>',
    'Draft',
    '{"relationshipType":"Alumni","emailOptIn":"true"}',
    null,
    0,
    0,
    0,
    now() - interval '15 days',
    now() - interval '2 days'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '33333333-3333-4333-8333-333333333333',
    'Sponsor Invitation',
    'Help fuel Friday night football',
    'Local support makes a lasting impact.',
    '<h1>Help fuel Friday night football</h1><p>Your sponsorship helps create opportunities for student-athletes while connecting your business with a proud football community.</p>',
    'Draft',
    '{"tags":["business"],"emailOptIn":"true"}',
    null,
    0,
    0,
    0,
    now() - interval '10 days',
    now() - interval '1 day'
  )
on conflict (id) do update set
  title = excluded.title,
  subject = excluded.subject,
  preheader = excluded.preheader,
  html_content = excluded.html_content,
  status = excluded.status,
  audience_filter = excluded.audience_filter,
  sent_at = excluded.sent_at,
  recipient_count = excluded.recipient_count,
  open_count = excluded.open_count,
  click_count = excluded.click_count,
  updated_at = excluded.updated_at;

insert into public.contact_activities (
  contact_id,
  activity_type,
  title,
  body,
  metadata,
  created_at
)
select
  contacts.id,
  'membership_payment_received',
  'Membership activated',
  'Annual membership payment recorded in demo data.',
  '{"source":"demo-seed"}'::jsonb,
  contacts.last_payment_at::timestamptz
from public.contacts
where contacts.membership_status = 'Active Member';

insert into public.campaign_blast_events (
  blast_id,
  event_type,
  email,
  metadata,
  created_at
) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'sent', 'jordan.miller@example.com', '{"source":"demo-seed"}', now() - interval '2 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'sent', 'marcus.reed@example.com', '{"source":"demo-seed"}', now() - interval '2 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'sent', 'avery.johnson@example.com', '{"source":"demo-seed"}', now() - interval '2 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'opened', 'jordan.miller@example.com', '{"source":"demo-seed"}', now() - interval '1 day'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'clicked', 'jordan.miller@example.com', '{"source":"demo-seed"}', now() - interval '22 hours');

notify pgrst, 'reload schema';
