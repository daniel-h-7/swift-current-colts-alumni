const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const environment = { NEXT_PUBLIC_SITE_VARIANT: 'colts' };
function load(path, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const api = {};
  vm.runInNewContext(code, {exports:api,process:{env:environment},URLSearchParams,require:name=>{
    if (name === 'server-only') return {};
    if (name in imports) return imports[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }});
  return api;
}
const branding = load('src/lib/site-brand.ts');
const slugs = load('src/lib/client-slugs.ts');
let savedContent = null;
let queriedClient;
const api = load('src/lib/site-content.ts', {
  '@/lib/site-brand': branding,
  '@/lib/client-slugs': slugs,
  '@/lib/client-context': {getCurrentClientId:()=> 'colts'},
  '@/lib/platform-data': {getPlatformClient:async id=> ({id,site_variant:id==='ram-club'?'rmrfootball':id})},
  '@/lib/supabase/server': {createServerSupabaseClient:()=>({from:()=>({select:()=>({eq(key,value){if(key==='client_id')queriedClient=value;return this;},maybeSingle:async()=>({data:{site_content:savedContent},error:null})})})})},
});

test('RMR defaults retain Rams branding and content on a Colts/platform deployment', () => {
  const content = api.getDefaultSiteContent('rmrfootball');
  assert.equal(content.brand.siteTitle, 'Rocky Mountain Rams Football');
  assert.match(content.brand.heroTitle,/CLIMB HIGHER/);
  assert.ok(content.sponsors.some(s=>s.name==='Eagle Homes'));
  assert.ok(content.events.some(e=>e.title==='Rams Alumni Night'));
  assert.ok(!content.sponsors.some(s=>s.name==='Pioneer Co-op'));
});
test('Colts defaults stay distinct and per-call variants do not change the environment', () => {
  const colts = api.getDefaultSiteContent('colts');
  assert.equal(colts.brand.siteTitle, 'Colts Football');
  assert.ok(colts.sponsors.some(s=>s.name==='Pioneer Co-op'));
  assert.equal(branding.getSiteBrand().variant,'colts');
});
test('saved content wins while missing fields fall back to the correct organization', () => {
  const content = api.normalizeSiteContent({brand:{siteTitle:'Our Rams',primaryColor:'#123456'},sponsors:[{name:'Actual Sponsor',imageUrl:'https://example.test/sponsor.png',linkUrl:'https://example.test'}]},'rmrfootball');
  assert.equal(content.brand.siteTitle,'Our Rams');
  assert.equal(content.brand.primaryColor,'#123456');
  assert.match(content.brand.heroTitle,/CLIMB HIGHER/);
  assert.equal(content.sponsors[0].name,'Actual Sponsor');
});
test('client database identity selects the right defaults and preserves saved content', async () => {
  savedContent = {brand:{siteTitle:'Saved Rams'}};
  const content = await api.getSiteContentForClient('ram-club');
  assert.equal(queriedClient,'ram-club');
  assert.equal(content.brand.siteTitle,'Saved Rams');
  assert.match(content.brand.heroTitle,/CLIMB HIGHER/);
});
test('legacy Colts hostname reads the existing Colts record', async () => {
  savedContent = null;
  const content = await api.getSiteContentForClient('sccoltsfootball');
  assert.equal(queriedClient,'colts');
  assert.equal(content.brand.siteTitle,'Colts Football');
});
