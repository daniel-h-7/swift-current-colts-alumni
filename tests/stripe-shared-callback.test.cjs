const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./helpers/load-ts.cjs');

function fixture({ owner = true, invalid = false } = {}) {
  const calls = [];
  const load = loader({
    env: { TEAMALUM_STUDIO_URL: 'https://www.teamalum.com' },
    mocks: {
      'next/cache': { revalidatePath: path => calls.push(['refresh', path]) },
      '@/lib/studio-auth': { getStudioClientOwner: async id => { calls.push(['owner', id]); return owner ? { authUserId: 'owner_rams' } : null; } },
      '@/lib/stripe-oauth': {
        resolveStripeOAuthClientId: async () => { if (invalid) throw Error('Stripe authorization expired'); return 'rams'; },
        finishStripeOAuth: async (...args) => calls.push(['finish', ...args]),
      },
    },
  });
  return { load, calls };
}
const request = (query = 'code=test_code&state=test_state&clientId=colts') => new Request(`https://www.teamalum.com/studio/payments/oauth/callback?${query}`);

test('shared Stripe callback returns to the server-selected team and ignores supplied team IDs', async () => {
  const f = fixture();
  const route = f.load('src/app/studio/payments/oauth/callback/route.ts');
  const response = await route.GET(request());
  assert.equal(response.headers.get('location'), 'https://www.teamalum.com/studio/rams/payments?stripe_returned=1');
  assert.deepEqual(f.calls.find(c => c[0] === 'finish').slice(1), ['rams', 'owner_rams', 'https://www.teamalum.com', 'test_state', 'test_code']);
});

test('legacy callback requires its team to match the secure state', async () => {
  const f = fixture();
  const route = f.load('src/app/studio/[clientId]/payments/oauth/callback/route.ts');
  const bad = await route.GET(request(), { params: Promise.resolve({ clientId: 'colts' }) });
  assert.match(bad.headers.get('location'), /studio\/login/);
  assert.equal(f.calls.length, 0);
  const good = await route.GET(request(), { params: Promise.resolve({ clientId: 'rams' }) });
  assert.match(good.headers.get('location'), /rams\/payments\?stripe_returned=1/);
});

test('missing owner, invalid state and canceled authorization never exchange the Stripe code', async () => {
  for (const options of [{ owner: false }, { invalid: true }, {}]) {
    const f = fixture(options);
    const response = await f.load('src/app/studio/payments/oauth/callback/route.ts').GET(request('error=access_denied&state=test_state'));
    assert.equal(response.status, 303);
    assert.equal(f.calls.filter(c => c[0] === 'finish').length, 0);
    if (options.owner === false) assert.match(response.headers.get('location'), /next=%2Fstudio%2Frams%2Fpayments/);
    if (!options.invalid && options.owner !== false) assert.match(response.headers.get('location'), /canceled/);
  }
});
