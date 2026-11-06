const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NextRequest,NextResponse}=require('next/server');
const loader=require('./helpers/load-ts.cjs');
const campaign='0fd67415-2b06-485b-81e2-89e7aaa6ffdf';
function resolver({user=true,hq=false,owner='rmrfootball',allowed=true,ids=['rmrfootball']}={}){
 const reads=[];
 const {GET}=loader({mocks:{
  'next/server':{NextResponse},
  '@/lib/studio-auth':{getStudioSession:async()=>user?{authUserId:'owner'}:null,getStudioClientIdsForUser:async()=>ids},
  '@/lib/hq-auth':{isHqAuthenticated:async()=>hq},
  '@/lib/team-admin':{canManageTeamOperations:async(id)=>allowed&&id==='rmrfootball'},
  '@/lib/supabase/server':{createServerSupabaseClient:()=>({from(table){reads.push(table);return{select(){return this;},eq(k,v){reads.push([k,v]);return this;},maybeSingle:async()=>({data:owner?{client_id:owner}:null})};}})}
 }})('src/app/studio/admin/recover/route.ts');
 return{reads,async go(path,team){const query=new URLSearchParams({path,...(team?{team}:{})});return GET(new Request(`https://www.teamalum.com/studio/admin/recover?${query}`));}};
}
test('HQ legacy admin routes recover through Studio; old mutations are rejected and standalone behavior stays intact',async()=>{
 const {proxy}=loader({env:{TEAMALUM_APP_MODE:'platform'},globals:{Headers}})('src/proxy.ts');
 const response=await proxy(new NextRequest('https://www.teamalum.com/admin/login',{headers:{referer:`https://www.teamalum.com/studio/rmrfootball/admin/campaigns/${campaign}/edit`}}));
 const location=new URL(response.headers.get('location'));
 assert.equal(location.pathname,'/studio/admin/recover');assert.equal(location.searchParams.get('path'),'/admin/login');assert.equal(location.searchParams.get('team'),'rmrfootball');
 const cross=await proxy(new NextRequest('https://www.teamalum.com/admin/login',{headers:{referer:'https://evil.example/studio/colts/admin'}}));
 assert.equal(new URL(cross.headers.get('location')).searchParams.has('team'),false);
 const denied=await proxy(new NextRequest(`https://www.teamalum.com/admin/campaigns/${campaign}/edit`,{method:'POST',headers:{origin:'https://www.teamalum.com'}}));
 assert.equal(denied.status,409);
 const normal=await proxy(new NextRequest('https://www.teamalum.com/studio/rmrfootball/admin/campaigns'));
 assert.equal(normal.headers.get('x-middleware-request-x-teamalum-admin-client'),'rmrfootball');
 const standalone=await loader({globals:{Headers}})('src/proxy.ts').proxy(new NextRequest('https://legacy.example/admin/login'));
 assert.equal(standalone.headers.get('location'),null);assert.equal(standalone.headers.get('x-middleware-next'),'1');
});
test('old campaign/message links recover the database owner and preserve their precise destination',async()=>{
 const f=resolver();const path=`/admin/campaigns/${campaign}/blasts/231d9f0b-9c70-4622-80cc-ea0285fb4180?test_sent=1`;
 const response=await f.go(path,'colts');
 assert.equal(new URL(response.headers.get('location')).pathname,`/studio/rmrfootball${path.split('?')[0]}`);
 assert.equal(new URL(response.headers.get('location')).search,'?test_sent=1');
 assert.equal(f.reads[0],'campaigns');assert.ok(f.reads.some(v=>Array.isArray(v)&&v[0]==='id'&&v[1]===campaign));
});
test('login recovery retains authorization and never turns a legacy cookie or team hint into access',async()=>{
 const anonymous=resolver({user:false});const response=await anonymous.go(`/admin/campaigns/${campaign}`);
 assert.equal(new URL(response.headers.get('location')).pathname,'/studio/login');assert.equal(anonymous.reads.length,0);
 assert.match(new URL(response.headers.get('location')).searchParams.get('next'),/^\/studio\/admin\/recover/);
 const denied=resolver({allowed:false});assert.equal(new URL((await denied.go(`/admin/campaigns/${campaign}`)).headers.get('location')).pathname,'/studio');
 const login=resolver();assert.equal(new URL((await login.go('/admin/login','rmrfootball')).headers.get('location')).pathname,'/studio/rmrfootball/admin');
 const many=resolver({ids:['rmrfootball','colts']});assert.equal(new URL((await many.go('/admin')).headers.get('location')).pathname,'/studio');
});
test('external and malformed legacy destinations cannot redirect outside Studio',async()=>{
 for(const path of ['https://evil.example/admin','//evil.example/admin','/admin/../hq','/admin/\\evil.example','/admin%2fcampaigns']){
  const f=resolver();const response=await f.go(path);
  const url=new URL(response.headers.get('location'));assert.equal(url.origin,'https://www.teamalum.com');assert.equal(url.pathname,'/studio/rmrfootball/admin');
 }
});
