const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./helpers/load-ts.cjs');

function stripeFixture(session, contactAccount = 'acct_rams') {
  const calls = [];
  const load = loader({ env: {}, globals: { fetch: async (url, options) => { calls.push({url, options}); return { ok: true, json: async () => url.includes('billing_portal') ? {id:'bps_test',url:'https://billing.stripe.com/test'} : session }; } }, mocks: {
    '@/lib/supabase/server': { getServerEnvValue: key => key === 'STRIPE_SECRET_KEY' ? 'sk_live_example' : undefined },
    '@/lib/client-context': { getCurrentClientId: () => 'colts' },
    '@/lib/client-integrations': { getClientIntegration: async id => { assert.equal(id,'rams'); return {external_account_id:contactAccount}; } },
    '@/lib/stripe-connection': { verifyClientStripeAccount: async id => assert.equal(id,'rams') },
  } });
  return { api: load('src/lib/stripe.ts'), calls };
}
const paid = {id:'cs_live_example',mode:'subscription',livemode:true,status:'complete',payment_status:'paid',metadata:{client_id:'rams'}};
test('membership confirmation requires the correct connected account, team, mode and completed payment', async () => {
  for (const [session, expected] of [[paid,'confirmed'],[{...paid,metadata:{client_id:'colts'}},'unverified'],[{...paid,livemode:false},'unverified'],[{...paid,payment_status:'unpaid'},'pending'],[{...paid,status:'expired'},'unverified']]) {
    const f = stripeFixture(session);
    assert.equal(await f.api.confirmClientMembership('rams','cs_live_example'),expected);
    assert.equal(f.calls[0].options.headers['Stripe-Account'],'acct_rams');
    assert.equal(f.calls[0].options.cache,'no-store');
    assert.equal(f.calls[0].options.method,undefined); // read-only GET
  }
  const f = stripeFixture(paid);
  assert.equal(await f.api.confirmClientMembership('rams'), 'unverified');
  assert.equal(await f.api.confirmClientMembership('rams','not-a-session'), 'unverified');
  assert.equal(f.calls.length,0);
});
test('portal uses the explicit team and refuses a stale contact payment account', async () => {
  const f = stripeFixture(paid);
  await f.api.createStripeCustomerPortalSession({clientId:'rams',customerId:'cus_rams',expectedAccountId:'acct_rams',returnUrl:'https://rams.teamalum.com/membership/manage'});
  assert.equal(f.calls[0].options.headers['Stripe-Account'],'acct_rams');
  await assert.rejects(f.api.createStripeCustomerPortalSession({clientId:'rams',customerId:'cus_old',expectedAccountId:'acct_colts',returnUrl:'https://rams.teamalum.com/membership/manage'}), /different payment account/);
  assert.equal(f.calls.length,1);
});
test('metadata uses the resolved team instead of platform or deployment-default copy', async () => {
  const load = loader({mocks:{'@/lib/platform-data':{getPlatformClientByStudioSlug:async()=>({id:'rams',name:'Rams Football',subdomain:'rams',launch_approved_at:'yes'})},'@/lib/site-content':{getSiteContentForClient:async()=>({brand:{heroBody:'Support our Rams athletes.',logoUrl:'/rams.png'}})}}});
  const meta=await load('src/lib/client-public-metadata.ts').clientPublicMetadata('rams','join');
  assert.equal(meta.title,'Support Rams Football');
  assert.equal(meta.description,'Support our Rams athletes.');
  assert.equal(meta.alternates.canonical,'https://rams.teamalum.com/join');
  assert.equal(meta.openGraph.images[0].url,'https://rams.teamalum.com/rams.png');
});
test('known stale sponsor destination is disabled without guessing a replacement',()=>{
 const api=loader()('src/lib/legends.ts');
 assert.equal(api.safeSponsorHref('Sussex Insurance','https://www.cranbrookflooring.com/'),null);
 assert.equal(api.safeSponsorHref('Cranbrook Flooring','https://www.cranbrookflooring.com/'),'https://www.cranbrookflooring.com/');
 assert.equal(api.safeSponsorHref('Another sponsor','https://example.com/'),'https://example.com/');
});
test('membership-management lookup, email and activity stay scoped to the URL team',async()=>{
 const filters=[],emails=[],portal=[],activity=[];
 const load=loader({mocks:{
  '@/lib/platform-data':{getPlatformClientByStudioSlug:async()=>({id:'rams',name:'Rams Football',launch_approved_at:'yes'})},
  '@/lib/contact-activity':{logContactActivity:async input=>activity.push(input)},
  '@/lib/email-settings':{getEmailSettingsForClient:async id=>{assert.equal(id,'rams');return{};},formatFromEmail:()=> 'Rams <accounts@example.test>'},
  '@/lib/email-provider':{isEmailDeliveryConfigured:()=>true,sendCampaignTestEmail:async input=>emails.push(input)},
  '@/lib/stripe':{isStripeConfigured:()=>true,createStripeCustomerPortalSession:async input=>{portal.push(input);return{id:'bps_test',url:'https://billing.stripe.com/test'};}},
  '@/lib/unsubscribe':{createUnsubscribeUrl:()=>null},
  '@/lib/supabase/server':{createServerSupabaseClient:()=>({from:()=>({select(){return this;},eq(k,v){filters.push([k,v]);return this;},maybeSingle:async()=>({data:{id:'contact_rams',email:'member@example.test',stripe_customer_id:'cus_rams',stripe_account_id:'acct_rams'}})})})},
 }});
 const api=load('src/lib/membership-management.ts');
 const req=origin=>new Request('https://rams.teamalum.com/site/rams/api/membership/portal',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'member@example.test',clientId:'colts'})});
 assert.equal((await api.sendMembershipManagementLink(req('https://evil.test'),'rams')).status,403);
 assert.equal(emails.length,0);
 assert.equal((await api.sendMembershipManagementLink(req('https://rams.teamalum.com'),'rams')).status,200);
 assert.ok(filters.some(([key,val])=>key==='client_id'&&val==='rams'));
 assert.equal(portal[0].clientId,'rams');assert.equal(portal[0].expectedAccountId,'acct_rams');
 assert.match(emails[0].subject,/Rams Football/);assert.equal(emails[0].to,'member@example.test');assert.equal(activity[0].clientId,'rams');
});
