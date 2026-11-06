const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NextResponse}=require('next/server');
const loader=require('./helpers/load-ts.cjs');
function fixture(){
 const activities=[],updates=[],filters=[]; let gift=0,automation=0,lookupError=false;
 const session={id:'cs_paid',customer:'cus_rams',subscription:'sub_rams',payment_status:'paid',livemode:true,amount_total:600,metadata:{client_id:'rams',contact_id:'contact_rams',membership_amount_cents:'500',additional_gift_amount_cents:'100'}};
 const db={from(table){return {conditions:[],select(){return this;},eq(k,v){this.conditions.push([k,v]);filters.push([table,k,v]);return this;},contains(k,v){this.metadata=v;return this;},limit(){return this;},maybeSingle:async function(){if(table==='contacts') return {data:{gift_donation_amount_cents:gift}};if(lookupError) return {error:{message:'lookup failed'}};return {data:activities.find(a=>a.type==='membership_payment_completed'&&a.clientId===this.conditions.find(([k])=>k==='client_id')[1]&&a.contactId===this.conditions.find(([k])=>k==='contact_id')[1]&&a.metadata.stripe_checkout_session_id===this.metadata.stripe_checkout_session_id&&a.metadata.stripe_account_id===this.metadata.stripe_account_id)||null};},update(row){this.row=row;return this;},then(resolve){updates.push(this.row);gift=this.row.gift_donation_amount_cents;return Promise.resolve({error:null}).then(resolve);}};}};
 const api=loader({mocks:{
  'next/server':{NextResponse},'@/lib/client-context':{getCurrentClientId:()=> 'other_team'},
  '@/lib/stripe-connect':{stripePlatformMode:()=> 'live'},'@/lib/stripe-connection':{handleStripeAccountEvent:async()=>{}},
  '@/lib/stripe':{getStripeWebhookSecret:()=> 'not-a-real-secret',constructStripeWebhookEvent:()=>({id:'evt_checkout',account:'acct_rams',livemode:true,type:'checkout.session.completed',data:{object:session}})},
  '@/lib/supabase/server':{createServerSupabaseClient:()=>db},
  '@/lib/contact-activity':{logContactActivity:async a=>activities.push(a)},
  '@/lib/new-signup-automation':{runNewSignupAutomation:async()=>{automation++;}}
 }})('src/app/api/stripe/webhook/route.ts');
 return {activities,updates,filters,get automation(){return automation;},failLookup(){lookupError=true;},async deliver(){return api.POST(new Request('https://www.teamalum.com/api/stripe/webhook',{method:'POST',body:'{}'}));}};
}
test('a scheduled retry after successful manual replay does not count the gift or send signup automation twice',async()=>{
 const f=fixture();assert.equal((await f.deliver()).status,200);assert.equal((await f.deliver()).status,200);
 assert.equal(f.updates.length,1);assert.equal(f.updates[0].gift_donation_amount_cents,100);assert.equal(f.updates[0].annual_dues_amount_cents,500);
 assert.equal(f.activities.filter(a=>a.type==='membership_payment_completed').length,1);assert.equal(f.automation,1);
 assert.ok(f.filters.some(([t,k,v])=>t==='contact_activities'&&k==='client_id'&&v==='rams'));
});
test('a replay-history lookup failure stops processing without changing the contact',async()=>{
 const f=fixture();f.failLookup();assert.equal((await f.deliver()).status,400);assert.equal(f.updates.length,0);assert.equal(f.automation,0);
});
