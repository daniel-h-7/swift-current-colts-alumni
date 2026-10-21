const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/email-provider.ts', 'utf8') + '\nexport { buildEmailHtml };';
const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
const api = {};
vm.runInNewContext(output, { exports: api, require: name => name === 'server-only' ? {} : require(name), process });

test('email frame uses the actual sender, preserves content and unsubscribe link, and escapes metadata', () => {
  const html = api.buildEmailHtml({from: 'RMR <mail@example.test>', html: '<h2>Team news</h2>', preheader: '<script>no</script>', unsubscribeUrl: 'https://example.test/unsubscribe?token=a&b=c'});
  assert.match(html, /RMR &lt;mail@example.test&gt;/);
  assert.doesNotMatch(html, /Swift Current Colts/);
  assert.match(html, /<h2>Team news<\/h2>/);
  assert.match(html, /&lt;script&gt;no&lt;\/script&gt;/);
  assert.match(html, /token=a&amp;b=c/);
  assert.match(html, /background:#ffffff/);
  assert.match(html, /background:#c5a45b/);
});
test('email frame supports messages without optional preheader or unsubscribe URL', () => {
  const html = api.buildEmailHtml({from:'TeamAlum', html:'<p>Hello</p>'});
  assert.doesNotMatch(html, /undefined|Unsubscribe from emails/);
});

test('Legends email frame uses presentation tables and preserves an authored message without rewriting its styles', () => {
  const body='<h1 style="color:#2255bb;font-size:42px">Club update</h1><a href="https://example.test/join">Join</a>';
  const html=api.buildEmailHtml({from:'Lions Alumni <mail@example.test>',html:body});
  assert.ok(html.includes(body));assert.match(html,/role="presentation"/);assert.match(html,/Always part of the team/);assert.doesNotMatch(html,/border-radius:28px|<script|<iframe/);
});
