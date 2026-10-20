const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const output = ts.transpileModule(fs.readFileSync('src/lib/password-recovery.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const api = {};
vm.runInNewContext(output, { exports: api, URLSearchParams });

test('accepts a complete recovery link without changing token contents', () => {
  const tokens = api.parsePasswordRecoveryFragment('#type=recovery&access_token=a%2Bb&refresh_token=r%3D');
  assert.equal(tokens.access_token, 'a+b');
  assert.equal(tokens.refresh_token, 'r=');
});
test('rejects expired, incomplete, and normal login links', () => {
  for (const hash of ['', '#type=recovery&access_token=a', '#type=signup&access_token=a&refresh_token=r', '#type=recovery&access_token=a&refresh_token=r&error_code=otp_expired']) {
    assert.throws(() => api.parsePasswordRecoveryFragment(hash));
  }
});
test('requires matching passwords and preserves intentional whitespace', () => {
  assert.ok(api.validateNewPassword('short', 'short'));
  assert.ok(api.validateNewPassword('password-one', 'password-two'));
  assert.ok(api.validateNewPassword(' example ', 'example'));
  assert.equal(api.validateNewPassword(' example ', ' example '), null);
});
