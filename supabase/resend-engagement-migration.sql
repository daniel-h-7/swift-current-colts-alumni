-- Run once in the shared HQ database. Safe to rerun; no emails are sent.
begin;
alter table public.campaign_blast_events add column if not exists provider_event_id text;
create unique index if not exists campaign_blast_events_provider_event_unique
  on public.campaign_blast_events(provider_event_id) where provider_event_id is not null;
create index if not exists campaign_blast_events_resend_message_idx
  on public.campaign_blast_events ((metadata->>'provider_id')) where metadata->>'provider' = 'resend';

create or replace function public.refresh_campaign_email_totals(p_client_id text, p_blast_id uuid)
returns void language plpgsql set search_path = public as $$
declare sent_total integer; opened_total integer; clicked_total integer; last_sent timestamptz;
begin
  -- Serialize refreshes per blast, including webhook/send events arriving together.
  perform 1 from public.campaign_blasts where client_id = p_client_id and id = p_blast_id for update;
  select
    count(distinct coalesce(nullif(metadata->>'provider_id', ''), id::text)) filter
      (where event_type in ('new_signup_email_sent', 'blast_send_sent', 'email.sent')),
    count(distinct coalesce(nullif(metadata->>'provider_id', ''), email, id::text)) filter
      (where event_type in ('email.opened', 'opened')),
    count(distinct coalesce(nullif(metadata->>'provider_id', ''), email, id::text)) filter
      (where event_type in ('email.clicked', 'clicked')),
    max(created_at) filter (where event_type in ('new_signup_email_sent', 'blast_send_sent', 'email.sent'))
  into sent_total, opened_total, clicked_total, last_sent
  from public.campaign_blast_events where client_id = p_client_id and blast_id = p_blast_id;
  update public.campaign_blasts set
    recipient_count = greatest(recipient_count, sent_total),
    open_count = greatest(open_count, opened_total),
    click_count = greatest(click_count, clicked_total),
    sent_at = greatest(sent_at, last_sent),
    status = case when last_sent is not null then 'Sent' else status end
  where client_id = p_client_id and id = p_blast_id;
end $$;

create or replace function public.refresh_campaign_email_totals_on_event()
returns trigger language plpgsql set search_path = public as $$
begin
  perform public.refresh_campaign_email_totals(new.client_id, new.blast_id);
  return new;
end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'campaign_email_event_totals'
    and tgrelid = 'public.campaign_blast_events'::regclass) then
    create trigger campaign_email_event_totals after insert on public.campaign_blast_events
    for each row execute function public.refresh_campaign_email_totals_on_event();
  end if;
end $$;

create or replace function public.record_resend_campaign_event(
  p_provider_id text, p_event_id text, p_event_type text, p_created_at timestamptz,
  p_client_id text default null, p_blast_id text default null
) returns text language plpgsql security definer set search_path = public as $$
declare owner_id text; owner_blast uuid; recipient text;
begin
  if p_provider_id is null or p_provider_id = '' or p_event_id is null or p_event_id = '' or p_created_at is null then
    raise exception 'Missing email event identity';
  end if;
  if p_event_type not in ('email.sent', 'email.delivered', 'email.opened', 'email.clicked',
    'email.bounced', 'email.complained', 'email.failed', 'email.delivery_delayed', 'email.suppressed') then
    return 'ignored';
  end if;
  -- Existing send records, including older untagged welcome emails, determine ownership.
  select client_id, blast_id, email into owner_id, owner_blast, recipient
  from public.campaign_blast_events
  where metadata->>'provider' = 'resend' and metadata->>'provider_id' = p_provider_id
    and event_type in ('new_signup_email_sent', 'blast_send_sent', 'email.sent', 'email.delivered',
      'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.failed',
      'email.delivery_delayed', 'email.suppressed')
  order by created_at limit 1;
  -- Signed Resend tags also cover events delivered before our send record is inserted.
  if owner_blast is null and p_blast_id ~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
    select client_id, id into owner_id, owner_blast from public.campaign_blasts
    where client_id = p_client_id and id = p_blast_id::uuid;
  end if;
  -- Auth, management-link and test emails are intentionally outside campaign reporting.
  if owner_blast is null then return 'ignored'; end if;
  insert into public.campaign_blast_events(client_id, blast_id, email, event_type, provider_event_id, created_at, metadata)
  values (owner_id, owner_blast, recipient, p_event_type, p_event_id, p_created_at,
    jsonb_build_object('provider', 'resend', 'provider_id', p_provider_id))
  on conflict (provider_event_id) where provider_event_id is not null do nothing;
  return 'recorded';
end $$;

revoke all on function public.refresh_campaign_email_totals(text, uuid) from public, anon, authenticated;
revoke all on function public.refresh_campaign_email_totals_on_event() from public, anon, authenticated;
revoke all on function public.record_resend_campaign_event(text, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.refresh_campaign_email_totals(text, uuid) to service_role;
grant execute on function public.refresh_campaign_email_totals_on_event() to service_role;
grant execute on function public.record_resend_campaign_event(text, text, text, timestamptz, text, text) to service_role;

-- Backfill totals from actual saved sends, without sending or inventing engagement.
do $$ declare b record; begin
  for b in select client_id, id from public.campaign_blasts loop
    perform public.refresh_campaign_email_totals(b.client_id, b.id);
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
