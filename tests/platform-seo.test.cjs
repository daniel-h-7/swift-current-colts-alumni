const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./helpers/load-ts.cjs');

function site(host, mode = 'platform') {
  return loader({ env: { TEAMALUM_APP_MODE: mode }, mocks: { 'next/headers': { headers: async () => new Headers({ host }) } } });
}

test('marketing sitemap and brand identity stay on the marketing host', async () => {
  const load = site('www.teamalum.com');
  const entries = await load('src/app/sitemap.ts').default();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].url, 'https://www.teamalum.com/');
  const robots = await load('src/app/robots.ts').default();
  assert.equal(robots.sitemap, 'https://www.teamalum.com/sitemap.xml');
  assert.ok(robots.rules.disallow.includes('/studio'));
  const seo = load('src/lib/platform-seo.ts');
  assert.equal(seo.platformStructuredData['@graph'][1].alternateName[0], 'Team Alum');
  assert.equal(seo.platformHomeMetadata.alternates.canonical, entries[0].url);
});

test('tenant and standalone sites never advertise the TeamAlum marketing sitemap', async () => {
  for (const [host, mode] of [['rmrfootball.teamalum.com', 'platform'], ['sccoltsfootball.teamalum.com', 'client'], ['teamalum.com.example.test', 'platform']]) {
    const load = site(host, mode);
    assert.equal((await load('src/app/sitemap.ts').default()).length, 0);
    assert.equal((await load('src/app/robots.ts').default()).sitemap, undefined);
  }
});
