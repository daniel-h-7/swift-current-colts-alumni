const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./helpers/load-ts.cjs');

test('Studio uses its exact configured origin and rejects production loopback addresses', () => {
  const navigation = env => loader({ env })('src/lib/studio-navigation.ts');
  assert.equal(navigation({ NODE_ENV: 'production', TEAMALUM_STUDIO_URL: 'https://www.teamalum.com' }).studioOrigin('https://demo.teamalum.com/hq'), 'https://www.teamalum.com');
  for (const address of ['http://localhost:3000', 'https://localhost', 'http://127.0.0.1:3000', 'http://[::1]:3000', 'http://teamalum.com', 'https://user:password@www.teamalum.com']) {
    assert.throws(() => navigation({ NODE_ENV: 'production', TEAMALUM_STUDIO_URL: address }).studioOrigin('https://www.teamalum.com'));
  }
  assert.equal(navigation({ NODE_ENV: 'development' }).studioOrigin('http://localhost:3000/studio'), 'http://localhost:3000');
});

test('password reset sends the canonical callback while retaining local development fallback', async () => {
  for (const resetRedirectTo of ['https://www.teamalum.com/studio/reset-password', undefined]) {
    const calls = [];
    const load = loader({
      globals: { window: { location: { origin: 'http://localhost:3013' } }, FormData: class { get() { return ' owner@example.test '; } } },
      mocks: {
        react: { useState: value => [value, () => {}], useRef: value => ({ current: value }), useEffect() {} },
        '@/lib/supabase/browser': { createBrowserSupabaseClient: () => ({ auth: { resetPasswordForEmail: async (...args) => { calls.push(args); return {}; } } }) },
      },
    });
    const form = load('src/components/studio/password-recovery-form.tsx').PasswordRecoveryForm({ mode: 'request', resetRedirectTo });
    await form.props.onSubmit({ preventDefault() {}, currentTarget: {} });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'owner@example.test');
    assert.equal(calls[0][1].redirectTo, resetRedirectTo ?? 'http://localhost:3013/studio/reset-password');
  }
});

test('forgot password page supplies the server configured Studio callback to the browser form', () => {
  const load = loader({
    env: { NODE_ENV: 'production', TEAMALUM_STUDIO_URL: 'https://www.teamalum.com' },
    mocks: { '@/components/studio-header': { StudioHeader: () => null }, '@/components/studio/password-recovery-form': { PasswordRecoveryForm: () => null } },
  });
  const page = load('src/app/studio/forgot-password/page.tsx').default();
  assert.equal(page.props.children[1].props.children.props.resetRedirectTo, 'https://www.teamalum.com/studio/reset-password');
});
