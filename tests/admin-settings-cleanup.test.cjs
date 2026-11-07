const {test}=require('node:test');const assert=require('node:assert/strict');
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');const loader=require('./helpers/load-ts.cjs');
test('fee settings save only the selected team price, preserve content fields, and reject invalid or anonymous submissions',async()=>{
 let allowed=true;const writes=[],paths=[];
 const load=loader({mocks:{
  '@/lib/admin-auth':{isAdminAuthenticated:async()=>allowed},
  '@/lib/team-admin':{adminPath:async p=>p.replace('/admin','/studio/rams/admin'),getWorkspaceClientId:async()=> 'rams'},
  'next/cache':{revalidatePath:p=>paths.push(p)},
  '@/lib/supabase/server':{createServerSupabaseClient:()=>({from:table=>({upsert:async(value,options)=>{writes.push({table,value,options});return {error:null};}})})},
 }});
 const {POST}=load('src/app/admin/settings/membership/route.ts');
 const request=amount=>{const form=new FormData();form.set('annual_membership_amount',amount);form.set('join_body','Injected replacement');return new Request('https://www.teamalum.com/studio/rams/admin/settings/membership',{method:'POST',body:form});};
 assert.equal((await POST(request('6.25'))).status,303);
 assert.equal(writes[0].value.client_id,'rams');assert.equal(writes[0].value.annual_membership_amount_cents,625);
 for(const key of ['join_body','join_headline','join_is_open','membership_year_label','renewal_deadline','site_content','email_from_address'])assert.equal(Object.hasOwn(writes[0].value,key),false,key);
 assert.ok(paths.includes('/site/rams/join'));assert.ok(paths.includes('/studio/rams/content'));
 for(const amount of ['', '-1','6abc','1.001','Infinity'])await POST(request(amount));
 assert.equal(writes.length,1);allowed=false;await POST(request('10'));assert.equal(writes.length,1);
});
test('Settings exposes only supporter fee and email controls with neutral placeholders',async()=>{
 const load=loader({mocks:{
  'next/navigation':{useRouter:()=>({refresh(){}})},
  '@/lib/admin-auth':{isAdminAuthenticated:async()=>true},'@/lib/team-admin':{adminPath:async p=>p},
  '@/components/admin-navigation':{AdminForm:props=>React.createElement('form',props)},
  '@/components/admin-header':{AdminHeader:({title})=>React.createElement('h1',null,title)},
  '@/lib/membership-settings':{getMembershipSettings:async()=>({annual_membership_amount_cents:500})},
  '@/lib/email-settings':{getEmailSettings:async()=>({email_from_name:'Your Team',email_from_address:'accounts@teamalum.com',email_reply_to:'',email_sending_domain:''})},
 }});
 const Page=load('src/app/admin/settings/page.tsx').default;
 const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({})}));
 assert.match(html,/Supporter Fee/);assert.match(html,/Email Settings/);assert.match(html,/value="5.00"/);
 assert.match(html,/placeholder="Your Team"/);assert.match(html,/alumni@yourteam.com/);
 assert.doesNotMatch(html,/Colts|Site Content|join_headline|join_body|join_is_open|renewal_deadline|bg-blue|bg-black/);
});
test('unknown brands and shared defaults are neutral while actual Colts branding remains explicit',()=>{
 const load=loader({env:{NEXT_PUBLIC_SITE_VARIANT:'colts'},mocks:{'@/lib/team-admin':{},'@/lib/supabase/server':{},'@/lib/platform-data':{}}});
 const {getSiteBrand}=load('src/lib/site-brand.ts');assert.equal(getSiteBrand('colts').programName,'Colts Football');
 const generic=getSiteBrand('new-team');assert.equal(generic.programName,'Your Team');assert.doesNotMatch(JSON.stringify(generic),/Colts|Swift Current/);
 const content=load('src/lib/site-content.ts').getDefaultSiteContent('new-team');assert.doesNotMatch(JSON.stringify(content),/Colts|Swift Current|Pioneer Co-op/);
 assert.equal(load('src/lib/email-settings.ts').getDefaultEmailSettings().email_from_name,'Your Team');
 assert.doesNotMatch(JSON.stringify(load('src/lib/membership-settings.ts').getDefaultMembershipSettings()),/Colts|Swift Current/);
});
