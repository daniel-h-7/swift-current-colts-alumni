const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, imports) {
  const code = ts.transpileModule(fs.readFileSync(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const api = {};
  vm.runInNewContext(code,{exports:api,Date,URL,require:name=>name==='server-only'?{}:imports[name]??require(name)});
  return api;
}
const { updateClientAccountEmail } = load('src/lib/client-account-email.ts', {'@/lib/supabase/server': {createServerSupabaseClient:()=>{throw Error('Unexpected real connection');}}});
function fixture(options={}) {
  const writes=[]; const filters=[]; let queryIndex=0;
  const results=[
    {data:options.missing?null:{id:'membership',auth_user_id:'auth-user',email:'old@example.test'},error:null},
    {data:[{client_id:'rmrfootball'},{client_id:'colts'}],error:null},
    {data:options.conflict?[{id:'other-user'}]:[],error:null},
    {data:options.databaseFailure?null:[{id:'membership'},{id:'second-membership'}],error:options.databaseFailure?{message:'db failed'}:null},
  ];
  return {writes,filters, supabase:{
    from(table) {
      assert.equal(table,'client_users');
      const index=queryIndex++;
      return {
        select(){return this;},eq(k,v){filters.push([index,k,v]);return this;},in(){return this;},neq(){return this;},limit(){return this;},
        update(value){writes.push({kind:'database',value});return this;},
        maybeSingle:async()=>results[index],then(resolve,reject){return Promise.resolve(results[index]).then(resolve,reject);},
      };
    },
    auth:{admin:{
      getUserById:async()=>({data:{user:{email:'old@example.test',email_confirmed_at:'2026-01-01'}},error:null}),
      updateUserById:async(id,value)=>{
        writes.push({kind:'auth',id,value});
        const fail=options.authFailure||(options.rollbackFailure&&value.email==='old@example.test');
        return {error:fail?{message:'auth failed'}:null};
      },
    }},
  }};
}
const input={clientId:'rmrfootball',clientUserId:'membership',email:' NEW@Example.Test ',expectedEmail:'old@example.test'};
test('updates the actual login and synchronizes all affiliations for that auth user', async()=>{
  const f=fixture();
  const result=await updateClientAccountEmail({...input,supabase:f.supabase});
  assert.equal(result.email,'new@example.test');
  assert.equal(f.writes[0].kind,'auth');
  assert.equal(f.writes[0].value.email_confirm,true);
  assert.equal(f.writes[1].value.email,'new@example.test');
  assert.ok(f.filters.some(([i,k,v])=>i===0&&k==='client_id'&&v==='rmrfootball'));
  assert.ok(f.filters.some(([i,k,v])=>i===3&&k==='auth_user_id'&&v==='auth-user'));
});
test('rejects invalid, unlinked, stale, and conflicting accounts before changing credentials', async()=>{
  for(const [options,changes] of [[{}, {email:'invalid'}],[{missing:true},{}],[{}, {expectedEmail:'stale@example.test'}],[{conflict:true},{}]]){
    const f=fixture(options);
    await assert.rejects(updateClientAccountEmail({...input,...changes,supabase:f.supabase}));
    assert.equal(f.writes.length,0);
  }
});
test('an authentication rejection leaves the database untouched', async()=>{
  const f=fixture({authFailure:true});
  await assert.rejects(updateClientAccountEmail({...input,supabase:f.supabase}),/Unable to update the login email/);
  assert.equal(f.writes.length,1);
});
test('restores the previous login email if account synchronization fails', async()=>{
  const f=fixture({databaseFailure:true});
  await assert.rejects(updateClientAccountEmail({...input,supabase:f.supabase}),/previous value/);
  assert.equal(f.writes[2].kind,'auth');
  assert.equal(f.writes[2].value.email,'old@example.test');
});
test('reports an incomplete update when rollback fails', async()=>{
  const f=fixture({databaseFailure:true,rollbackFailure:true});
  await assert.rejects(updateClientAccountEmail({...input,supabase:f.supabase}),/login email changed.*reconcile/);
});

const {NextResponse}=require('next/server');
let authenticated=true; let configured=true; let calls=[];
const route=load('src/app/hq/clients/[id]/users/email/route.ts',{
  'next/cache':{revalidatePath:()=>{}},'next/server':{NextResponse},
  '@/lib/hq-auth':{isHqAuthenticated:async()=>authenticated},
  '@/lib/supabase/server':{getServerEnvValue:()=>configured?'test-service-role':undefined},
  '@/lib/client-account-email':{updateClientAccountEmail:async args=>{calls.push(args);}},
});
function request(origin='https://teamalum.com') {
 const body=new FormData();for(const [k,v] of Object.entries({client_user_id:'membership',email:'new@example.test',expected_email:'old@example.test'}))body.set(k,v);
 return new Request('https://teamalum.com/hq/clients/rmrfootball/users/email',{method:'POST',headers:origin?{Origin:origin}:{},body});
}
const context={params:Promise.resolve({id:'rmrfootball'})};
test('endpoint requires HQ login and same-origin submissions', async()=>{
  authenticated=false;calls=[];
  assert.equal((await route.POST(request(),context)).status,303);
  assert.equal(calls.length,0);
  authenticated=true;
  for(const origin of ['https://other.test',''])assert.equal((await route.POST(request(origin),context)).status,403);
  assert.equal(calls.length,0);
});
test('endpoint refuses changes without service-role configuration',async()=>{
  configured=false;calls=[];
  const response=await route.POST(request(),context);
  assert.match(response.headers.get('location'),/account_error=/);
  assert.equal(calls.length,0);
  configured=true;
});
test('endpoint scopes updates to the route client and returns a visible success state',async()=>{
  calls=[];
  const response=await route.POST(request(),context);
  assert.equal(calls[0].clientId,'rmrfootball');
  assert.match(response.headers.get('location'),/account_saved=1#account-access$/);
});
