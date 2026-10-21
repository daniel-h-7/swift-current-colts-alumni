const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');
function load(path, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const api = {};
  vm.runInNewContext(code, {exports:api,process:{env:{}},Headers,require:name=>imports[name] ?? require(name)});
  return api;
}
const slugs = load('src/lib/client-slugs.ts');
const { proxy: middleware } = load('src/proxy.ts', {'./lib/team-admin-routing':load('src/lib/team-admin-routing.ts'),'./lib/client-slugs':slugs,'./lib/client-address':load('src/lib/client-address.ts'),'./lib/studio-navigation':load('src/lib/studio-navigation.ts')});
function request(url) { return new NextRequest(url, { headers: { host: new URL(url).host } }); }

test('legacy hostnames share the canonical client record', () => {
  assert.equal(slugs.resolveClientSlug('sccoltsfootball'), 'colts');
  assert.equal(slugs.resolveClientSlug('rmramsfootball'), 'rmrfootball');
  assert.equal(slugs.resolveClientSlug('rmrfootball'), 'rmrfootball');
  assert.equal(slugs.resolveClientSlug('another-club'), 'another-club');
});
test('Colts home, join and success requests preserve the canonical tenant and query', async () => {
  for (const [path, target] of [['/','/site/colts'],['/join','/site/colts/join'],['/membership/success','/site/colts/membership/success'],['/success','/site/colts/membership/success']]) {
    const response = await middleware(request(`https://sccoltsfootball.teamalum.com${path}?test=1`));
    const rewrite = new URL(response.headers.get('x-middleware-rewrite'));
    assert.equal(rewrite.pathname,target);
    assert.equal(rewrite.search,'?test=1');
  }
});
test('RMR stays mapped to its existing client', async () => {
  for (const host of ['rmrfootball','rmramsfootball']) {
    const response = await middleware(request(`https://${host}.teamalum.com/join`));
    assert.equal(new URL(response.headers.get('x-middleware-rewrite')).pathname,'/site/rmrfootball/join');
  }
});
test('platform and Studio requests are not redirected into the Colts tenant', async () => {
  for (const url of ['https://teamalum.com/','https://www.teamalum.com/','https://sccoltsfootball.teamalum.com/studio/login']) {
    const response = await middleware(request(url));
    assert.equal(response.headers.get('x-middleware-rewrite'), null);
  }
});
