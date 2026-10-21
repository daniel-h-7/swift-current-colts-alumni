const {test}=require('node:test');const assert=require('node:assert/strict');const loader=require('./helpers/load-ts.cjs');
const load=loader();const {buildLaunchReadiness}=load('src/lib/launch-readiness.ts');const {validateClientSubdomain}=load('src/lib/client-address.ts');const {safeStudioNext,studioOrigin}=load('src/lib/studio-navigation.ts');
const client={id:'rmrfootball',subdomain:'rmrfootball',setup_state:{content_reviewed_at:'now',visual_reviewed_at:'now',features_reviewed_at:'now',preview_reviewed_at:'now',domain_verified_at:'now',domain_verified_hostname:'rmrfootball.teamalum.com'}};
const content={brand:{siteTitle:'Rams',heroTitle:'Rams together',heroBody:'Support our program',heroImageUrl:'/images/stadium.jpg'}};
const features=[{feature_key:'memberships',is_enabled:true},{feature_key:'sponsors',is_enabled:true}];
const stripe={integration_key:'stripe_connect',status:'connected',external_account_id:'acct_rams',metadata:{verification_mode:'live',verified_client_id:'rmrfootball',verified_account_id:'acct_rams',charges_enabled:true,payouts_enabled:true,details_submitted:true}};
test('one checklist can reach full completion and excludes payments when memberships are disabled',()=>{
 const r=buildLaunchReadiness({client,content,features,stripe});assert.equal(r.completed,r.items.length);assert.equal(r.isReady,true);
 const noPay=buildLaunchReadiness({client,content,features:[{feature_key:'memberships',is_enabled:false},{feature_key:'events',is_enabled:true}],mode:'mock'});assert.equal(noPay.isReady,true);assert.ok(!noPay.items.some(i=>i.key==='payments'));
});
test('template content, assigned address, and a raw Connected label are insufficient',()=>{
 const r=buildLaunchReadiness({client:{...client,setup_state:{}},content,features,stripe:{...stripe,metadata:{}}});assert.equal(r.isReady,false);assert.equal(r.completed,1);assert.equal(r.nextAction.key,'content');assert.ok(r.blockers.some(i=>i.key==='domain'));
});
test('readiness rejects the wrong account, sandbox mode, disabled payouts, and changed hostname',()=>{
 for(const metadata of [{...stripe.metadata,verified_client_id:'colts'},{...stripe.metadata,payouts_enabled:false},{...stripe.metadata,verification_mode:'sandbox'}])assert.ok(buildLaunchReadiness({client,content,features,stripe:{...stripe,metadata}}).blockers.some(i=>i.key==='payments'));
 assert.ok(buildLaunchReadiness({client:{...client,subdomain:'new-rams'},content,features,stripe}).blockers.some(i=>i.key==='domain'));
});
test('reserved names and invalid/overlong slugs are rejected consistently',()=>{
 for(const value of ['www','app','teamalum','hq','studio','a'.repeat(64),'-team','team-','Upper','team.name',''])assert.ok(validateClientSubdomain(value),value);
 for(const value of ['rmrfootball','sccoltsfootball','a','team-2026'])assert.equal(validateClientSubdomain(value),null);
});
test('login return paths reject external redirects and preserve the intended organization',()=>{
 assert.equal(safeStudioNext('/studio/rmrfootball/payments?check=1'),'/studio/rmrfootball/payments?check=1');
 for(const v of ['https://evil.test','//evil.test','/studio/\\evil.test','/admin','/studio/login','/studio/logout','/studio/%2f%2fevil'])assert.equal(safeStudioNext(v),'/studio');
 assert.equal(studioOrigin('https://rmrfootball.teamalum.com/studio/a'),'https://rmrfootball.teamalum.com');
});
test('deliberately empty lists remain empty while missing fields retain defaults',()=>{
 const contentLoad=loader({mocks:{'@/lib/client-context':{getCurrentClientId:()=> 'colts'},'@/lib/platform-data':{},'@/lib/supabase/server':{}}});
 const api=contentLoad('src/lib/site-content.ts');
 const empty=api.normalizeSiteContent({brand:{siteTitle:'Rams'},sponsors:[],events:[],spotlights:[],fundraisingCampaigns:[],impactStats:[]},'rmrfootball');
 for(const key of ['sponsors','events','spotlights','fundraisingCampaigns','impactStats'])assert.equal(empty[key].length,0);
 assert.ok(api.normalizeSiteContent({brand:{}},'rmrfootball').sponsors.length>0);
});
test('invitation tokens work only on the explicit invitation flow',()=>{
 const api=load('src/lib/password-recovery.ts');const hash='#type=invite&access_token=a&refresh_token=b';
 assert.throws(()=>api.parsePasswordRecoveryFragment(hash));assert.equal(api.parsePasswordRecoveryFragment(hash,'invite').access_token,'a');
});
