const {test}=require('node:test');const assert=require('node:assert/strict');const loader=require('./helpers/load-ts.cjs');const {NextResponse}=require('next/server');
const core=loader({mocks:{'@/lib/supabase/server':{getServerEnvValue:()=> 'sk_test_example'}}})('src/lib/stripe-connect.ts');
test('Connected requires submitted details, payments, payouts, and no blocking requirements',()=>{
 const ready={id:'acct_a',charges_enabled:true,payouts_enabled:true,details_submitted:true};
 assert.equal(core.getStripeAccountStatus(ready),'connected');
 assert.equal(core.getStripeAccountStatus({...ready,payouts_enabled:false}),'pending');
 assert.equal(core.getStripeAccountStatus({...ready,requirements:{disabled_reason:'rejected'}}),'needs_attention');
 assert.equal(core.getStripeAccountStatus({...ready,requirements:{past_due:['business_profile.url']}}),'needs_attention');
});
function map(id='client-a',account='acct_a'){return{integration_key:'stripe_connect',status:'connected',external_account_id:account,metadata:{verified_client_id:id,verified_account_id:account,verification_mode:'sandbox',charges_enabled:true,payouts_enabled:true,details_submitted:true}};}
test('unconnected, pending and mismatched clients never use the configured shared fallback',async()=>{
 let integration;let checkouts=0;
 const load=loader({mocks:{'@/lib/client-integrations':{getClientIntegration:async()=>integration},'@/lib/client-context':{getCurrentClientId:()=> 'client-a'},'@/lib/site-brand':{getSiteBrand:()=>({programName:'A',variant:'colts'})},'@/lib/supabase/server':{getServerEnvValue:k=>k==='STRIPE_SECRET_KEY'?'sk_test_example':k==='STRIPE_CONNECTED_ACCOUNT_ID'?'acct_shared':undefined,createServerSupabaseClient:()=>({})},'@/lib/stripe-connect':{stripePlatformMode:()=> 'sandbox',getStripeAccountStatus:core.getStripeAccountStatus,retrieveConnectedAccount:async id=>({id,charges_enabled:true,payouts_enabled:true,details_submitted:true})}},globals:{fetch:async(url,options)=>{checkouts++;assert.equal(options.headers['Stripe-Account'],'acct_a');assert.ok(!options.body.has('transfer_data[destination]'));return{ok:true,json:async()=>({id:'cs_test',url:'https://checkout.stripe.com/test'})};}}});
 const api=load('src/lib/stripe.ts');const input={clientId:'client-a',contactId:'c',customerEmail:'a@example.test',membershipAmountCents:10000,membershipLabel:'Membership',cancelUrl:'https://example.test/join',successUrl:'https://example.test/success'};
 for(const value of [undefined,{...map(),status:'pending'},map('client-b'),{...map(),metadata:{...map().metadata,verified_account_id:'acct_wrong'}}]){integration=value;await assert.rejects(api.createStripeCheckoutSession(input));}
 assert.equal(checkouts,0);integration=map();assert.equal((await api.createStripeCheckoutSession(input)).stripeAccountId,'acct_a');assert.equal(checkouts,1);
});
test('continuing or canceling existing setup keeps Connected and its metadata',async()=>{
 const integration=map();let owner={authUserId:'owner',email:'owner@example.test'};let fail=false;let creates=0;
 const load=loader({mocks:{'@/lib/client-integrations':{getClientIntegration:async()=>integration},'@/lib/platform-data':{getPlatformClient:async()=>({id:'client-a',name:'A'})},'@/lib/stripe-connect':{createStripeAccountOnboardingLink:async()=>{if(fail)throw Error('link unavailable');return{url:'https://connect.stripe.com/setup'};}},'@/lib/stripe-onboarding':{createOrResumeStripeAccount:async()=>{creates++;}},'@/lib/studio-auth':{getStudioClientOwner:async()=>owner},'next/server':{NextResponse}}});
 const api=load('src/app/studio/[clientId]/payments/connect/route.ts');const context={params:Promise.resolve({clientId:'client-a'})};
 const req=()=>new Request('https://teamalum.com/studio/client-a/payments/connect',{method:'POST',headers:{origin:'https://teamalum.com'},body:new FormData()});
 assert.match((await api.POST(req(),context)).headers.get('location'),/connect.stripe.com/);fail=true;
 assert.match((await api.POST(req(),context)).headers.get('location'),/error=/);assert.equal(integration.status,'connected');assert.equal(creates,0);
 owner=null;assert.match((await api.POST(req(),context)).headers.get('location'),/studio\/login/);assert.equal(creates,0);
});
test('only an explicit Studio owner can manage payments, even beside an HQ session',async()=>{
 const crypto=require('node:crypto');const secret='test-studio-secret';const payload=Buffer.from(JSON.stringify({authUserId:'u',email:'u@example.test'})).toString('base64url');const token=payload+'.'+crypto.createHmac('sha256',secret).update(payload).digest('hex');let role='viewer';
 const load=loader({mocks:{'@/lib/hq-auth':{isHqAuthenticated:async()=>true},'next/headers':{cookies:async()=>({get:()=>({value:token})})},'@supabase/supabase-js':{},'@/lib/supabase/server':{getServerEnvValue:()=>secret,createServerSupabaseClient:()=>({from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:role==='owner'?{auth_user_id:'u',email:'u@example.test',role}:null,error:null})})})}}});
 const api=load('src/lib/studio-auth.ts');for(role of ['viewer','editor','admin'])assert.equal(await api.getStudioClientOwner('client-a'),null);role='owner';assert.equal((await api.getStudioClientOwner('client-a')).authUserId,'u');
});
test('retries use the durable Stripe attempt and stable account-creation parameters',async()=>{
 let creates=[];let resumed=false;let saved=0;const attempt={attempt_id:'stable-attempt',parameters:{clientId:'client-a',email:'original@example.test',name:'A'},account_id:null};
 const load=loader({mocks:{'@/lib/supabase/server':{createServerSupabaseClient:()=>({rpc:async()=>({data:attempt,error:null}),from:()=>({update(){return this;},eq(){return this;},then(resolve){return Promise.resolve({error:null}).then(resolve);}})})},'@/lib/stripe-connect':{stripePlatformMode:()=> 'live',createStandardConnectedAccount:async input=>{creates.push(input);return{id:'acct_a'};},retrieveConnectedAccount:async id=>{resumed=true;return{id};}},'@/lib/stripe-connection':{saveVerifiedStripeConnection:async()=>saved++}}});
 const api=load('src/lib/stripe-onboarding.ts');await api.createOrResumeStripeAccount({id:'client-a',name:'Changed A'},{authUserId:'owner',email:'changed@example.test'});await api.createOrResumeStripeAccount({id:'client-a',name:'Changed Again'},{authUserId:'owner',email:'changed-again@example.test'});
 assert.equal(creates[0].idempotencyKey,creates[1].idempotencyKey);assert.equal(creates[1].email,'original@example.test');attempt.account_id='acct_a';await api.createOrResumeStripeAccount({id:'client-a',name:'A'},{authUserId:'owner',email:'x@example.test'});assert.equal(creates.length,2);assert.equal(resumed,true);assert.equal(saved,3);
});
