const {test}=require('node:test');const assert=require('node:assert/strict');const loader=require('./helpers/load-ts.cjs');
function oauthFixture(){
 const states=[];const cookies=new Map();let selected='acct_original';let saved=[];let exchanges=0;
 const supabase={from:()=>({filters:[],insert:async row=>{states.push({...row});return{error:null};},delete(){return this;},eq(k,v){this.filters.push([k,v]);return this;},gt(){return this;},select(){return this;},maybeSingle:async function(){const index=states.findIndex(row=>this.filters.every(([k,v])=>row[k]===v));return{data:index<0?null:states.splice(index,1)[0],error:null};}})};
 const load=loader({mocks:{'next/headers':{cookies:async()=>({get:name=>cookies.has(name)?{value:cookies.get(name)}:undefined,set:(name,value)=>cookies.set(name,value)})},'@/lib/supabase/server':{getServerEnvValue:()=> 'ca_test',createServerSupabaseClient:()=>supabase},'@/lib/client-integrations':{getClientIntegration:async()=>({external_account_id:'acct_original'})},'@/lib/stripe-connect':{stripePlatformMode:()=> 'live',exchangeStripeOAuthCode:async()=>{exchanges++;return selected;},retrieveConnectedAccount:async id=>({id})},'@/lib/stripe-connection':{saveVerifiedStripeConnection:async(id,account)=>saved.push([id,account.id])}}});
 return{api:load('src/lib/stripe-oauth.ts'),states,cookies,saved,select:id=>{selected=id;},get exchanges(){return exchanges;}};
}
test('OAuth binds the browser, owner, client, origin and mode, and consumes authorization once',async()=>{
 const f=oauthFixture();const url=new URL(await f.api.beginStripeOAuth('rams','owner','https://teamalum.com'));const state=url.searchParams.get('state');
 assert.equal(url.searchParams.get('redirect_uri'),'https://teamalum.com/studio/rams/payments/oauth/callback');
 await assert.rejects(f.api.finishStripeOAuth('rams','other','https://teamalum.com',state,'code'),/already used|another account/);assert.equal(f.exchanges,0);
 await assert.rejects(f.api.finishStripeOAuth('rams','owner','https://other.test',state,'code'));assert.equal(f.exchanges,0);
 await assert.rejects(f.api.finishStripeOAuth('colts','owner','https://teamalum.com',state,'code'));assert.equal(f.exchanges,0);
 await f.api.finishStripeOAuth('rams','owner','https://teamalum.com',state,'code');assert.equal(f.saved[0][1],'acct_original');
 await assert.rejects(f.api.finishStripeOAuth('rams','owner','https://teamalum.com',state,'code'));assert.equal(f.exchanges,1);
});
test('OAuth refuses an unexpected account replacement and does not save it',async()=>{
 const f=oauthFixture();const url=new URL(await f.api.beginStripeOAuth('rams','owner','https://teamalum.com'));f.select('acct_wrong');
 await assert.rejects(f.api.finishStripeOAuth('rams','owner','https://teamalum.com',url.searchParams.get('state'),'code'),/different Stripe account/);assert.equal(f.saved.length,0);
});
test('account webhooks read current state, disable revoked connections and ignore other modes',async()=>{
 const writes=[];let reads=0;let current={id:'acct_rams',charges_enabled:true,payouts_enabled:false,details_submitted:true};
 const mapping={client_id:'rams',metadata:{verification_mode:'live',source:'owner'}};
 const client={from:()=>({select(){return this;},eq(){return this;},update(value){writes.push(value);return this;},then(resolve){return Promise.resolve({data:[mapping],error:null}).then(resolve);}}),rpc:async(name,args)=>{writes.push(args);return{error:null};}};
 const core=loader({mocks:{'@/lib/supabase/server':{getServerEnvValue:()=> 'sk_live_test'}}})('src/lib/stripe-connect.ts');
 const api=loader({mocks:{'@/lib/supabase/server':{createServerSupabaseClient:()=>client},'@/lib/stripe-connect':{stripePlatformMode:()=> 'live',getStripeAccountStatus:core.getStripeAccountStatus,retrieveConnectedAccount:async()=>{reads++;return current;}}}})('src/lib/stripe-connection.ts');
 await api.handleStripeAccountEvent({type:'account.updated',account:'acct_rams',livemode:false,data:{object:{id:'acct_rams'}}});assert.equal(reads,0);assert.equal(writes.length,0);
 await api.handleStripeAccountEvent({type:'account.updated',account:'acct_rams',livemode:true,data:{object:{id:'acct_rams',payouts_enabled:true}}});assert.equal(writes[0].p_status,'pending');assert.equal(writes[0].p_metadata.payouts_enabled,false);
 await api.handleStripeAccountEvent({type:'account.application.deauthorized',account:'acct_rams',livemode:true});assert.equal(writes[1].status,'disabled');assert.equal(writes[1].metadata.source,'owner');
 await assert.rejects(api.handleStripeAccountEvent({type:'account.updated',account:'acct_rams',livemode:true,data:{object:{id:'acct_other'}}}));
});
test('server launch approval uses the shared checklist and records explicit overrides',async()=>{
 let state={};let calls=[];
 const load=loader({mocks:{'@/lib/platform-data':{getPlatformClient:async()=>({id:'rams',subdomain:'rams',updated_at:'timestamp',setup_state:state}),getClientFeatures:async()=>[{feature_key:'memberships',is_enabled:false},{feature_key:'events',is_enabled:true}]},'@/lib/client-integrations':{getClientIntegration:async()=>undefined},'@/lib/site-content':{getSiteContentForClient:async()=>({brand:{siteTitle:'Rams',heroTitle:'Together',heroBody:'Support',heroImageUrl:'/hero.jpg'}})},'@/lib/stripe':{getStripeMode:()=> 'mock'},'@/lib/supabase/server':{createServerSupabaseClient:()=>({rpc:async(name,args)=>{calls.push(args);return{error:null};}})}}});
 const api=load('src/lib/launch-review.ts');await assert.rejects(api.approveClientLaunch('rams'),/Complete the launch checklist/);assert.equal(calls.length,0);
 await assert.rejects(api.approveClientLaunch('rams','short'));await api.approveClientLaunch('rams','Approved for a documented staging review');assert.match(calls[0].p_override.reason,/staging/);assert.ok(calls[0].p_override.blockers.length>0);
 state={content_reviewed_at:'now',visual_reviewed_at:'now',features_reviewed_at:'now',preview_reviewed_at:'now',domain_verified_at:'now',domain_verified_hostname:'rams.teamalum.com'};
 await api.approveClientLaunch('rams');assert.equal(calls[1].p_override,null);
});
