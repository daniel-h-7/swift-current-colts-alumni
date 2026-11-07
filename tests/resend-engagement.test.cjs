const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Webhook}=require('svix');
const {PGlite}=require('@electric-sql/pglite');
const loader=require('./helpers/load-ts.cjs');
const secret='whsec_'+Buffer.from('test-resend-secret-with-enough-bytes').toString('base64');
function request(payload,{signature=true,age=0}={}) {
 const body=JSON.stringify(payload), now=new Date(Date.now()-age*1000), id='msg_tracking_test';
 return new Request('https://www.teamalum.com/api/resend/webhook',{method:'POST',body,headers:{
 'svix-id':id,'svix-timestamp':String(Math.floor(now.getTime()/1000)),
 'svix-signature':signature?new Webhook(secret).sign(id,now,body):'v1,invalid'}});
}
test('Resend endpoint verifies signatures and timestamp before DB access and retries persistence errors',async()=>{
 let calls=[];let failure=false;
 const load=loader({env:{RESEND_WEBHOOK_SECRET:secret},mocks:{'@/lib/supabase/server':{createServerSupabaseClient:()=>({rpc:async(name,args)=>{calls.push([name,args]);return {data:'recorded',error:failure?{message:'db down'}:null};}})}}});
 const {POST}=load('src/app/api/resend/webhook/route.ts');
 const payload={type:'email.opened',created_at:new Date().toISOString(),data:{email_id:'message-a',tags:{teamalum_client_id:'rmrfootball',teamalum_blast_id:'blast-a'}}};
 assert.equal((await POST(request(payload,{signature:false}))).status,400);
 assert.equal((await POST(request(payload,{age:600}))).status,400);
 assert.equal(calls.length,0);
 assert.equal((await POST(request(payload))).status,200);
 assert.equal(calls[0][0],'record_resend_campaign_event');
 assert.equal(calls[0][1].p_client_id,'rmrfootball');
 assert.equal(calls[0][1].p_provider_id,'message-a');
 assert.equal((await POST(request({...payload,type:'contact.created'}))).status,200);
 assert.equal(calls.length,1);
 failure=true;assert.equal((await POST(request(payload))).status,503);
 const missing=loader({mocks:{'@/lib/supabase/server':{}}})('src/app/api/resend/webhook/route.ts');
 assert.equal((await missing.POST(request(payload))).status,503);
});
test('database backfills welcome sends, isolates teams and deduplicates message engagement and webhook retries',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table campaign_blasts(id uuid primary key,client_id text,recipient_count int default 0,open_count int default 0,click_count int default 0,sent_at timestamptz,status text default 'Draft');
 create table campaign_blast_events(id uuid primary key default gen_random_uuid(),client_id text,blast_id uuid references campaign_blasts(id),email text,event_type text,metadata jsonb default '{}',created_at timestamptz default now());
 insert into campaign_blasts(id,client_id) values ('11111111-1111-4111-8111-111111111111','rams'),('22222222-2222-4222-8222-222222222222','colts');
 insert into campaign_blast_events(client_id,blast_id,email,event_type,metadata) values ('rams','11111111-1111-4111-8111-111111111111','supporter@example.com','new_signup_email_sent','{"provider":"resend","provider_id":"message-a"}');`);
 const sql=fs.readFileSync('supabase/resend-engagement-migration.sql','utf8');await db.exec(sql);await db.exec(sql);
 const stats=async(id='rams')=>(await db.query('select * from campaign_blasts where client_id=$1',[id])).rows[0];
 assert.equal((await stats()).recipient_count,1);assert.equal((await stats()).status,'Sent');assert.ok((await stats()).sent_at);
 const event=async(type,id,provider='message-a',client='colts',blast='22222222-2222-4222-8222-222222222222')=>db.query('select record_resend_campaign_event($1,$2,$3,now(),$4,$5)',[provider,id,type,client,blast]);
 await event('email.opened','event-1');await event('email.opened','event-1');await event('email.opened','event-2');
 await event('email.clicked','event-3');await event('email.clicked','event-4');await event('email.sent','event-5');await event('email.delivered','event-6');
 assert.equal((await stats()).open_count,1);assert.equal((await stats()).click_count,1);assert.equal((await stats()).recipient_count,1);
 assert.equal((await stats('colts')).open_count,0);
 assert.equal((await db.query("select count(*)::int as n from campaign_blast_events where provider_event_id='event-1'")).rows[0].n,1);
 await db.exec(`insert into campaign_blast_events(client_id,blast_id,email,event_type,metadata) values ('rams','11111111-1111-4111-8111-111111111111','supporter@example.com','test_send_sent','{"provider":"resend","provider_id":"test-message"}');`);
 await event('email.opened','test-open','test-message',null,null);
 // Unrelated auth/test email has no tags or saved send and must not affect totals.
 await event('email.opened','event-7','unrelated',null,null);
 assert.equal((await stats()).open_count,1);
 // An early signed event uses a valid tag pair; later send record counts the message once.
 await event('email.opened','event-8','message-b','rams','11111111-1111-4111-8111-111111111111');
 await event('email.sent','event-9','message-b');
 assert.equal((await stats()).open_count,2);assert.equal((await stats()).recipient_count,2);
 await event('email.opened','event-10','message-c','colts','11111111-1111-4111-8111-111111111111');
 assert.equal((await stats()).open_count,2);
 await db.exec('set role authenticated');
 await assert.rejects(()=>event('email.opened','forged'));
 }finally{await db.close();}
});
test('provider tags only actual campaign messages and leaves ordinary tests untracked',async()=>{
 const bodies=[];const load=loader({env:{RESEND_API_KEY:'test-key'},globals:{fetch:async(_,options)=>{bodies.push(JSON.parse(options.body));return {ok:true,json:async()=>({id:'email-1'})};}}});
 const {sendCampaignTestEmail}=load('src/lib/email-provider.ts');
 const input={from:'TeamAlum <accounts@teamalum.com>',to:'test@example.com',subject:'Test',html:'Hello'};
 await sendCampaignTestEmail(input);await sendCampaignTestEmail({...input,campaignTracking:{clientId:'rams',blastId:'blast-a'}});
 assert.equal(bodies[0].tags,undefined);
 assert.equal(bodies[1].tags.find(tag=>tag.name==='teamalum_client_id').value,'rams');
 const {NextRequest}=require('next/server');
 // A demo password must never gate the signature-protected shared webhook.
 const gated=loader({env:{DEMO_PASSWORD:'demo'},globals:{Headers}})('src/proxy.ts');
 assert.equal((await gated.proxy(new NextRequest('https://www.teamalum.com/api/resend/webhook',{method:'POST'}))).status,200);
});
