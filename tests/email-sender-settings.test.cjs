const {test}=require('node:test');
const assert=require('node:assert/strict');
const loader=require('./helpers/load-ts.cjs');
const defaults={id:'default',email_from_address:'accounts@teamalum.com',email_from_name:'Rams Football',email_reply_to:'help@teamalum.com',email_sending_domain:''};
const {resolveEmailSettings,formatFromEmail}=loader({mocks:{'@/lib/supabase/server':{},'@/lib/platform-data':{},'@/lib/team-admin':{}}})('src/lib/email-settings.ts');
test('saved Resend test senders and empty addresses use the configured production sender',()=>{
 for(const value of ['onboarding@resend.dev',' ONBOARDING@RESEND.DEV ', '', '  ',null,undefined]) {
  const settings=resolveEmailSettings(defaults,{email_from_address:value,email_from_name:'TeamAlum'});
  assert.equal(settings.email_from_address,'accounts@teamalum.com');assert.equal(formatFromEmail(settings),'TeamAlum <accounts@teamalum.com>');
 }
});
test('custom team senders and reply-to preferences survive unchanged; no production sender is fabricated',()=>{
 const settings=resolveEmailSettings(defaults,{email_from_address:' members@rams.example ',email_from_name:'Rams',email_reply_to:'office@rams.example',email_sending_domain:'rams.example'});
 assert.equal(settings.email_from_address,'members@rams.example');assert.equal(settings.email_reply_to,'office@rams.example');assert.equal(settings.email_sending_domain,'rams.example');
 assert.equal(resolveEmailSettings({...defaults,email_from_address:'onboarding@resend.dev'},{email_from_address:'onboarding@resend.dev'}).email_from_address,'onboarding@resend.dev');
 assert.equal(resolveEmailSettings(defaults,{email_from_address:null,email_from_name:null}).email_from_name,'Rams Football');
});
test('team-scoped settings lookup resolves an old test sender through the current environment default',async()=>{
 const filters=[];
 const {getEmailSettingsForClient}=loader({env:{RESEND_FROM_EMAIL:'accounts@teamalum.com'},mocks:{
  '@/lib/platform-data':{getPlatformClient:async(id)=>({id,name:'Rams'})},'@/lib/team-admin':{},
  '@/lib/supabase/server':{createServerSupabaseClient:()=>({from:()=>({select(){return this;},eq(k,v){filters.push([k,v]);return this;},maybeSingle:async()=>({data:{id:'default',email_from_address:'onboarding@resend.dev',email_from_name:'Rams',email_reply_to:'',email_sending_domain:''}})})})}
 }})('src/lib/email-settings.ts');
 const settings=await getEmailSettingsForClient('rmrfootball');
 assert.equal(settings.email_from_address,'accounts@teamalum.com');assert.deepEqual(filters,[['client_id','rmrfootball'],['id','default']]);
});
