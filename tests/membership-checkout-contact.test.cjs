const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NextResponse}=require('next/server');
const loader=require('./helpers/load-ts.cjs');
function fixture(existing,lookupError,writeError) {
 const filters=[],writes=[];
 const supabase={from:()=>({select(){return this;},eq(k,v){filters.push([k,v]);return this;},maybeSingle:async()=>({data:existing,error:lookupError}),upsert(row){writes.push(row);return this;},single:async()=>({data:{id:'contact'},error:writeError}),update(row){writes.push(row);return this;},then(resolve){return Promise.resolve({error:writeError}).then(resolve);}})};
 const api=loader({mocks:{'@/lib/supabase/server':{createServerSupabaseClient:()=>supabase}}})('src/lib/membership-checkout-contact.ts');
 return {api,filters,writes};
}
test('repeat checkout preserves an existing active membership and dues until payment confirmation',async()=>{
 const f=fixture({membership_status:'Active Member',annual_dues_amount_cents:10000});
 await f.api.prepareMembershipContact('rams',{email:' Member@example.test ',first_name:'Member'},500);
 assert.equal(f.writes[0].membership_status,'Active Member');assert.equal(f.writes[0].annual_dues_amount_cents,10000);
 assert.equal(f.writes[0].email,'member@example.test');
 assert.deepEqual(f.filters,[['client_id','rams'],['email','member@example.test']]);
 assert.equal(Object.hasOwn(f.writes[0],'stripe_customer_id'),false);
});
test('new and unpaid contacts receive pending status and the new fee, but no paid entitlement',async()=>{
 for(const old of [null,{membership_status:'Pending Payment'},{membership_status:'Expired'}]){
  const f=fixture(old);await f.api.prepareMembershipContact('rams',{email:'member@example.test'},500);
  assert.equal(f.writes[0].membership_status,'Pending Payment');assert.equal(f.writes[0].annual_dues_amount_cents,500);
  assert.equal(Object.hasOwn(f.writes[0],'paid_through'),false);
 }
});
test('missing payment columns fail before contact write; checkout-link persistence errors are not ignored',async()=>{
 const f=fixture(null,{message:'column contacts.stripe_account_id does not exist'});
 await assert.rejects(f.api.prepareMembershipContact('rams',{email:'member@example.test'},500),/payment database setup/);assert.equal(f.writes.length,0);
 const broken=fixture(null,null,{message:'write failed'});
 await assert.rejects(broken.api.recordMembershipCheckout('rams','contact',{id:'cs_example',stripeAccountId:'acct_rams'}),/Unable to save/);
 assert.deepEqual(broken.filters,[['client_id','rams'],['id','contact']]);
});
test('both public checkout routes stop before Stripe on schema failure and withhold checkout URL on persistence failure',async()=>{
 for(const path of ['src/app/api/membership/checkout/route.ts','src/app/site/[clientId]/api/membership/checkout/route.ts']) for(const stage of ['prepare','record']){
  let stripeCalls=0;
  const route=loader({mocks:{
   'next/server':{NextResponse},'@/lib/client-context':{getCurrentClientId:()=> 'rams'},
   '@/lib/platform-data':{getPlatformClientByStudioSlug:async()=>({id:'rams',name:'Rams',launch_approved_at:'yes'})},
   '@/lib/contact-activity':{logContactActivity:async()=>{}},'@/lib/contact-validation':{isValidContact:()=>true},
   '@/lib/membership-settings':{getMembershipSettings:async()=>({join_is_open:true,annual_membership_amount_cents:500}),getMembershipSettingsForClient:async()=>({join_is_open:true,annual_membership_amount_cents:500})},
   '@/lib/stripe':{isStripeConfigured:()=>true,getStripeMode:()=> 'live',createStripeCheckoutSession:async()=>{stripeCalls++;return{id:'cs_example',url:'https://checkout.stripe.com/example'};}},
   '@/lib/membership-checkout-contact':{prepareMembershipContact:async()=>{if(stage==='prepare') throw Error('database setup');return{id:'contact'};},recordMembershipCheckout:async()=>{throw Error('Unable to save checkout');}}
  }})(path);
  const response=await route.POST(new Request('https://rams.teamalum.com/api/membership/checkout',{method:'POST',body:JSON.stringify({email:'member@example.test'})}),{params:Promise.resolve({clientId:'rams'})});
  assert.equal(response.status,500);assert.equal(stripeCalls,stage==='prepare'?0:1);assert.equal(Object.hasOwn(await response.json(),'checkoutUrl'),false);
 }
});
