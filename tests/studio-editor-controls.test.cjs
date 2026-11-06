const {test} = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {NextResponse} = require('next/server');
const loader = require('./helpers/load-ts.cjs');
const base = loader({mocks:{'@/lib/platform-data':{},'@/lib/client-context':{},'@/lib/supabase/server':{}}});
const {createStarterSiteContent} = base('src/lib/site-content.ts');

function endpoint(authorized=true) {
  let write;
  const original = createStarterSiteContent('Rams');
  original.events = Array.from({length:4},(_,i)=>({title:`Old event ${i}`,date:'',notes:'',imageUrl:'',linkLabel:'',linkUrl:''}));
  original.sponsors = Array.from({length:5},(_,i)=>({name:`Old partner ${i}`,imageUrl:'',linkUrl:''}));
  const route = loader({mocks:{
    'next/server':{NextResponse},'next/cache':{revalidatePath(){}},
    '@/lib/studio-auth':{canAccessStudioClient:async()=>authorized},
    '@/lib/setup-state':{updateSetupState:async()=>{}},'@/lib/supabase/server':{},
    '@/lib/membership-settings':{getMembershipSettingsForClient:async()=>({join_body:'Saved body',join_headline:'Saved title',membership_year_label:'Rams'})},
    '@/lib/site-content':{createStarterSiteContent,getSiteContentForClient:async()=>original,saveSiteContentForClient:async(id,content,membership)=>{write={id,content,membership};}}
  }})('src/app/studio/[clientId]/content/save/route.ts');
  return {get write(){return write;}, async save(form){return route.POST(new Request('https://www.teamalum.com/studio/rams/content/save',{method:'POST',body:form}),{params:Promise.resolve({clientId:'rams'})});}};
}

test('Studio saves all added sponsors/events, edited later rows, removals and supporter fee together', async()=>{
  const api = endpoint(); const form = new FormData();
  form.set('site_title','Rams'); form.set('sponsor_count','6');form.set('event_count','5');form.set('annual_membership_amount','12.34');
  for(let i=1;i<=6;i++) if(i!==2) {form.set(`sponsor_${i}_name`,`Partner ${i}`);form.set(`sponsor_${i}_image_url`,`/partner-${i}.png`);}
  for(let i=1;i<=5;i++) if(i!==3) {form.set(`event_${i}_title`,`Event ${i}`);form.set(`event_${i}_date`,'Fall 2027');form.set(`event_${i}_image_url`,`/event-${i}.png`);form.set(`event_${i}_link_url`,'https://example.com/register');form.set(`event_${i}_notes`,'Saved description');}
  const response=await api.save(form);
  assert.match(response.headers.get('location'),/saved=content/);
  assert.equal(api.write.id,'rams');
  assert.deepEqual(Array.from(api.write.content.sponsors,s=>s.name),['Partner 1','Partner 3','Partner 4','Partner 5','Partner 6']);
  assert.deepEqual(Array.from(api.write.content.events,e=>e.title),['Event 1','Event 2','Event 4','Event 5']);
  assert.equal(api.write.content.events[3].imageUrl,'/event-5.png');
  assert.equal(api.write.content.events[3].linkUrl,'https://example.com/register');
  assert.equal(api.write.membership.annualMembershipAmountCents,1234);
  assert.equal(api.write.membership.joinBody,'Saved body');
});
test('invalid fees and invalid list sizes are rejected before saving; anonymous users cannot change prices',async()=>{
  for (const [key,value] of [['annual_membership_amount','-1'],['annual_membership_amount',''],['annual_membership_amount','12oops'],['annual_membership_amount','1.234'],['annual_membership_amount','Infinity'],['sponsor_count','1001'],['event_count','1.5']]) {
    const api=endpoint();const form=new FormData();form.set(key,value);
    assert.match((await api.save(form)).headers.get('location'),/error=/);assert.equal(api.write,undefined);
  }
  const denied=endpoint(false);const form=new FormData();form.set('annual_membership_amount','1.00');
  assert.match((await denied.save(form)).headers.get('location'),/login/);assert.equal(denied.write,undefined);
});
test('supporter fee uses the existing team-scoped settings row and is omitted for older forms',async()=>{
  const writes=[];
  const {saveSiteContentForClient}=loader({mocks:{'@/lib/platform-data':{},'@/lib/client-context':{},'@/lib/supabase/server':{createServerSupabaseClient:()=>({from:()=>({upsert:async(row)=>{writes.push(row);return {error:null};}})})}}})('src/lib/site-content.ts');
  const membership={joinBody:'Body',joinHeadline:'Title',membershipYearLabel:'Rams'};
  await saveSiteContentForClient('rams',createStarterSiteContent('Rams'),{...membership,annualMembershipAmountCents:125});
  await saveSiteContentForClient('colts',createStarterSiteContent('Colts'),membership);
  assert.equal(writes[0].client_id,'rams');assert.equal(writes[0].annual_membership_amount_cents,125);
  assert.equal(Object.hasOwn(writes[1],'annual_membership_amount_cents'),false);
});
test('wording groups sit inside one closed Editable sections disclosure and list editor renders every saved row',()=>{
  const {LegendsCopyFields}=loader()('src/components/legends-copy-fields.tsx');
  const html=renderToStaticMarkup(React.createElement(LegendsCopyFields,{name:'Rams'}));
  assert.match(html,/<details[^>]*><summary[^>]*>Editable sections<\/summary>/);
  assert.doesNotMatch(html,/<details[^>]*\sopen(?:[ =>])/);
  const {HomepageListFields}=loader({mocks:{'@/components/studio/image-upload-field':{ImageUploadField:()=>null}}})('src/components/studio/homepage-list-fields.tsx');
  const fields=renderToStaticMarkup(React.createElement(HomepageListFields,{initialSponsors:Array.from({length:5},()=>({name:'Partner',imageUrl:'',linkUrl:''})),initialEvents:Array.from({length:4},()=>({title:'Event',imageUrl:''}))}));
  assert.match(fields,/name="sponsor_5_name"/);assert.match(fields,/name="event_4_title"/);
  assert.match(fields,/Add Another Sponsor/);assert.match(fields,/Add Another Event/);
});
