const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
let db;const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
before(async()=>{
 db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);');
 for(const file of ['supabase/schema.sql','supabase/platform-expansion.sql','supabase/setup-reliability.sql'])await db.exec(fs.readFileSync(file,'utf8').replace(/create extension if not exists pgcrypto;/g,''));
 await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)',[owner,'owner@example.test',other,'other@example.test']);
});after(async()=>{await db?.close();});
function input(id,extras={}){return{clientId:id,subdomain:id,name:'Test Program',siteVariant:'football',primaryDomain:id+'.teamalum.com',annualMembershipAmountCents:10000,membershipYearLabel:'Annual supporters',joinHeadline:'Join us',joinBody:'Support the program',siteContent:{brand:{siteTitle:'Test Program'},sponsors:[]},features:[{feature_key:'memberships',is_enabled:true}],ownerAuthUserId:owner,...extras};}
const provision=payload=>db.query('select public.teamalum_provision_client($1::jsonb) as id',[JSON.stringify(payload)]);
test('provisioning creates the client, content, features, integrations, and owner atomically',async()=>{
 await provision(input('atomic-team'));
 for(const table of ['clients','crm_settings','client_features','client_integrations','client_users']){
  const result=await db.query(`select count(*)::int as n from ${table} where ${table==='clients'?'id':'client_id'}=$1`,['atomic-team']);assert.ok(result.rows[0].n>0,table);
 }
 const ownerRow=await db.query("select email,role from client_users where client_id='atomic-team'");assert.equal(ownerRow.rows[0].role,'owner');assert.equal(ownerRow.rows[0].email,'owner@example.test');
});
test('failed provisioning rolls back every client write and retry succeeds without duplicates',async()=>{
 await assert.rejects(provision(input('retry-team',{features:[{feature_key:'not-a-feature',is_enabled:true}]})));
 assert.equal((await db.query("select count(*)::int as n from clients where id='retry-team'")).rows[0].n,0);
 await provision(input('retry-team'));await provision(input('retry-team',{name:'Attempted overwrite',annualMembershipAmountCents:500}));
 assert.equal((await db.query("select annual_membership_amount_cents as n from crm_settings where client_id='retry-team'")).rows[0].n,10000);
 assert.equal((await db.query("select count(*)::int as n from client_users where client_id='retry-team'")).rows[0].n,1);
 await assert.rejects(provision(input('retry-team',{ownerAuthUserId:other})),/already exists/);
});
test('reserved addresses cannot be provisioned even through the database function',async()=>{await assert.rejects(provision(input('www')),/reserved/);});
test('Stripe setup has durable retry parameters, owner enforcement and old-attempt reconciliation',async()=>{
 const begin=()=>db.query('select (public.teamalum_begin_stripe_setup($1,$2,$3,$4::jsonb)).*',['atomic-team',owner,'live',JSON.stringify({name:'Original'})]);
 const first=await begin();const second=await begin();assert.equal(first.rows[0].attempt_id,second.rows[0].attempt_id);
 await assert.rejects(db.query('select public.teamalum_begin_stripe_setup($1,$2,$3,$4::jsonb)',['atomic-team',other,'live','{}']),/Owner access/);
 await db.exec("update stripe_setup_attempts set created_at=now()-interval '25 hours' where client_id='atomic-team'");
 await assert.rejects(begin(),/reconciliation/);
 await db.exec("update stripe_setup_attempts set account_id='acct_persisted' where client_id='atomic-team'");assert.equal((await begin()).rows[0].account_id,'acct_persisted');
});
test('account linking prevents cross-client reuse and silent replacement, while retaining metadata',async()=>{
 const link=(client,account,metadata={})=>db.query('select public.teamalum_link_stripe_account($1,$2,$3,$4::jsonb)',[client,account,'connected',JSON.stringify(metadata)]);
 await link('atomic-team','acct_atomic',{source:'owner-onboarding'});await link('atomic-team','acct_atomic',{payouts_enabled:true});
 await assert.rejects(link('retry-team','acct_atomic'),/another client/);await assert.rejects(link('atomic-team','acct_replacement'),/cannot be replaced/);
 const row=(await db.query("select external_account_id,metadata from client_integrations where client_id='atomic-team' and integration_key='stripe_connect'")).rows[0];assert.equal(row.external_account_id,'acct_atomic');assert.equal(row.metadata.source,'owner-onboarding');assert.equal(row.metadata.payouts_enabled,true);
});
test('setup patches merge, and launch records explicit overrides and rejects stale review',async()=>{
 await db.query('select public.teamalum_update_setup_state($1,$2::jsonb)',['atomic-team',JSON.stringify({content_reviewed_at:'reviewed'})]);
 await db.query('select public.teamalum_update_setup_state($1,$2::jsonb)',['atomic-team',JSON.stringify({preview_reviewed_at:'reviewed'})]);
 let row=(await db.query("select setup_state,updated_at from clients where id='atomic-team'")).rows[0];assert.equal(row.setup_state.content_reviewed_at,'reviewed');assert.equal(row.setup_state.preview_reviewed_at,'reviewed');
 const stale=row.updated_at;await db.query('select public.teamalum_update_setup_state($1,$2::jsonb)',['atomic-team','{"preview_reviewed_at":null}']);
 await assert.rejects(db.query('select public.teamalum_approve_launch($1,$2,$3::jsonb)',['atomic-team',stale,null]),/changed during launch review/);
 row=(await db.query("select updated_at from clients where id='atomic-team'")).rows[0];
 await db.query('select public.teamalum_approve_launch($1,$2,$3::jsonb)',['atomic-team',row.updated_at,JSON.stringify({reason:'Approved for staging review',actor:'hq',blockers:['payments']})]);
 const approved=(await db.query("select launch_approved_at,setup_state from clients where id='atomic-team'")).rows[0];assert.ok(approved.launch_approved_at);assert.equal(approved.setup_state.launch_override.reason,'Approved for staging review');
});
test('setup functions and state tables are not accessible to public or authenticated database roles',async()=>{
 for(const role of ['anon','authenticated']){
  for(const fn of ['teamalum_provision_client(jsonb)','teamalum_update_setup_state(text,jsonb)','teamalum_begin_stripe_setup(text,uuid,text,jsonb)','teamalum_link_stripe_account(text,text,text,jsonb)','teamalum_approve_launch(text,timestamptz,jsonb)','teamalum_find_auth_user_by_email(text)'])assert.equal((await db.query('select has_function_privilege($1,$2,\'EXECUTE\') as allowed',[role,'public.'+fn])).rows[0].allowed,false,role+fn);
  assert.equal((await db.query('select has_table_privilege($1,$2,\'SELECT\') as allowed',[role,'public.stripe_oauth_states'])).rows[0].allowed,false);
 }
});
