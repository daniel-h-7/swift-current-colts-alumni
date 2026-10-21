-- Apply once in the shared Supabase project BEFORE deploying the setup fixes.
-- Additive; does not approve sites or change existing account mappings.
begin;
alter table public.clients add column if not exists setup_state jsonb not null default '{}'::jsonb;
alter table public.clients add column if not exists provisioning_owner_id uuid;

create table if not exists public.stripe_setup_attempts (
  client_id text not null references public.clients(id) on delete cascade,
  mode text not null check (mode in ('live','sandbox')),
  attempt_id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  parameters jsonb not null,
  account_id text,
  created_at timestamptz not null default now(),
  primary key (client_id, mode)
);
create table if not exists public.stripe_oauth_states (
  state_hash text primary key,
  client_id text not null references public.clients(id) on delete cascade,
  owner_id uuid not null,
  callback_origin text not null,
  previous_account_id text,
  mode text not null check (mode in ('live','sandbox')),
  expires_at timestamptz not null
);
alter table public.stripe_setup_attempts enable row level security;
alter table public.stripe_oauth_states enable row level security;
revoke all on public.stripe_setup_attempts, public.stripe_oauth_states from anon, authenticated;
grant all on public.stripe_setup_attempts, public.stripe_oauth_states to service_role;

create or replace function public.teamalum_update_setup_state(p_client_id text, p_patch jsonb)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  update public.clients set setup_state = setup_state || p_patch, updated_at = now() where id = p_client_id;
  if not found then raise exception 'Client not found'; end if;
end;
$$;

create or replace function public.teamalum_provision_client(p_input jsonb)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id text := p_input->>'clientId';
  v_owner uuid := nullif(p_input->>'ownerAuthUserId','')::uuid;
  v_email text;
  v_existing public.clients;
  v_feature jsonb;
  v_subdomain text := coalesce(nullif(p_input->>'subdomain',''),v_id);
begin
  if v_id is null or v_subdomain !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
     or v_subdomain in ('app','www','teamalum','api','hq','studio','admin','mail','support','help','assets','static') then
    raise exception 'Invalid or reserved site address';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_id,0));
  select * into v_existing from public.clients where id=v_id for update;
  if found then
    if v_owner is not null and exists(select 1 from public.client_users where client_id=v_id and auth_user_id=v_owner and role='owner') then return v_id; end if;
    raise exception 'That site already exists. Log in to its owner account or contact HQ to recover access.';
  end if;
  if v_owner is not null then
    select email into v_email from auth.users where id=v_owner;
    if v_email is null then raise exception 'Owner login not found'; end if;
  end if;
  insert into public.clients(id,name,site_variant,primary_domain,subdomain,custom_domain,plan_key,status,provisioning_owner_id,setup_state)
  values(v_id,p_input->>'name',p_input->>'siteVariant',p_input->>'primaryDomain',v_subdomain,nullif(p_input->>'customDomain',''),coalesce(p_input->>'planKey','starter'),coalesce(p_input->>'status','trial'),v_owner,jsonb_build_object('created_at',now()));
  insert into public.crm_settings(client_id,id,annual_membership_amount_cents,membership_year_label,join_headline,join_body,join_is_open,site_content)
  values(v_id,'default',(p_input->>'annualMembershipAmountCents')::integer,p_input->>'membershipYearLabel',p_input->>'joinHeadline',p_input->>'joinBody',true,p_input->'siteContent');
  for v_feature in select value from jsonb_array_elements(p_input->'features') loop
    insert into public.client_features(client_id,feature_key,is_enabled) values(v_id,v_feature->>'feature_key',(v_feature->>'is_enabled')::boolean);
  end loop;
  insert into public.client_integrations(client_id,integration_key,status) values(v_id,'stripe_connect','not_connected'),(v_id,'resend','not_connected'),(v_id,'custom_domain','not_connected');
  if v_owner is not null then
    insert into public.client_users(client_id,auth_user_id,email,full_name,role) values(v_id,v_owner,lower(v_email),p_input->>'name','owner');
  end if;
  return v_id;
end;
$$;

create or replace function public.teamalum_begin_stripe_setup(p_client_id text,p_owner_id uuid,p_mode text,p_parameters jsonb)
returns public.stripe_setup_attempts language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_attempt public.stripe_setup_attempts;
begin
  if not exists(select 1 from public.client_users where client_id=p_client_id and auth_user_id=p_owner_id and role='owner') then raise exception 'Owner access required'; end if;
  insert into public.stripe_setup_attempts(client_id,mode,owner_id,parameters) values(p_client_id,p_mode,p_owner_id,p_parameters) on conflict(client_id,mode) do nothing;
  select * into v_attempt from public.stripe_setup_attempts where client_id=p_client_id and mode=p_mode for update;
  if v_attempt.owner_id<>p_owner_id then raise exception 'An existing payment setup attempt needs HQ review'; end if;
  if v_attempt.account_id is null and v_attempt.created_at < now()-interval '23 hours' then raise exception 'An earlier Stripe setup needs reconciliation before another account can be created. Contact HQ.'; end if;
  return v_attempt;
end;
$$;

create or replace function public.teamalum_link_stripe_account(p_client_id text,p_account_id text,p_status text,p_metadata jsonb)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_current text; v_metadata jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('stripe:'||p_account_id,0));
  perform pg_advisory_xact_lock(hashtextextended('stripe-client:'||p_client_id,0));
  if exists(select 1 from public.client_integrations where integration_key='stripe_connect' and external_account_id=p_account_id and client_id<>p_client_id) then raise exception 'This Stripe account is already mapped to another client'; end if;
  select external_account_id,metadata into v_current,v_metadata from public.client_integrations where client_id=p_client_id and integration_key='stripe_connect' for update;
  if v_metadata->>'verification_mode' is not null and v_metadata->>'verification_mode' is distinct from p_metadata->>'verification_mode' then raise exception 'Stripe modes cannot share a client connection. Use a separate test database/client setup.'; end if;
  if v_current is not null and v_current<>p_account_id then raise exception 'An existing Stripe account cannot be replaced through setup. Ask HQ to plan a payment migration.'; end if;
  insert into public.client_integrations(client_id,integration_key,external_account_id,status,metadata,updated_at)
  values(p_client_id,'stripe_connect',p_account_id,p_status,p_metadata,now())
  on conflict(client_id,integration_key) do update set external_account_id=excluded.external_account_id,status=excluded.status,metadata=coalesce(client_integrations.metadata,'{}'::jsonb)||excluded.metadata,updated_at=now();
end;
$$;

revoke execute on function public.teamalum_update_setup_state(text,jsonb) from public, anon, authenticated;
revoke execute on function public.teamalum_provision_client(jsonb) from public, anon, authenticated;
revoke execute on function public.teamalum_begin_stripe_setup(text,uuid,text,jsonb) from public, anon, authenticated;
revoke execute on function public.teamalum_link_stripe_account(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.teamalum_update_setup_state(text,jsonb), public.teamalum_provision_client(jsonb), public.teamalum_begin_stripe_setup(text,uuid,text,jsonb), public.teamalum_link_stripe_account(text,text,text,jsonb) to service_role;
create or replace function public.teamalum_approve_launch(p_client_id text,p_expected_updated_at timestamptz,p_override jsonb)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  update public.clients set launch_approved_at=now(),published_at=now(),updated_at=now(),setup_state=setup_state||jsonb_build_object('launch_override',p_override)
  where id=p_client_id and updated_at=p_expected_updated_at;
  if not found then raise exception 'This client changed during launch review. Reload the checklist before approving.'; end if;
end;
$$;
revoke execute on function public.teamalum_approve_launch(text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.teamalum_approve_launch(text,timestamptz,jsonb) to service_role;
create or replace function public.teamalum_find_auth_user_by_email(p_email text)
returns jsonb language sql security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',id,'email',email) from auth.users where lower(email)=lower(trim(p_email)) limit 1;
$$;
revoke execute on function public.teamalum_find_auth_user_by_email(text) from public,anon,authenticated;
grant execute on function public.teamalum_find_auth_user_by_email(text) to service_role;
commit;
