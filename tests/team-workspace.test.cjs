const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextRequest } = require("next/server");
const loader = require("./helpers/load-ts.cjs");
function context({
  id = "rmrfootball",
  role = "owner",
  user = true,
  hq = false,
} = {}) {
  const writes = [],
    filters = [];
  const db = {
    from(table) {
      return {
        select() {
          return this;
        },
        eq(k, v) {
          filters.push([table, k, v]);
          return this;
        },
        maybeSingle: async () => ({
          data: role ? { role } : null,
          error: null,
        }),
        upsert: async (value) => {
          writes.push([table, value]);
          return { error: null };
        },
      };
    },
  };
  const mocks = {
    "next/headers": {
      headers: async () =>
        new Headers(id ? { "x-teamalum-admin-client": id } : {}),
      cookies: async () => ({ get: () => undefined }),
    },
    "@/lib/studio-auth": {
      getStudioSession: async () => (user ? { authUserId: "user-rams" } : null),
    },
    "@/lib/hq-auth": { isHqAuthenticated: async () => hq },
    "@/lib/client-context": { getCurrentClientId: () => "colts" },
    "@/lib/platform-data": {
      getPlatformClient: async (id) => ({
        id,
        name: "Rocky Mountain Rams Football",
        site_variant: "rmrfootball",
      }),
    },
    "@/lib/supabase/server": {
      getServerEnvValue: (k) =>
        k === "UNSUBSCRIBE_SECRET" ? "test-signing-secret" : undefined,
      createServerSupabaseClient: () => db,
    },
    "next/cache": { revalidatePath() {} },
  };
  return { load: loader({ mocks }), writes, filters, mocks };
}
test("each team admin URL forwards a server supplied scope without trusting browser headers", async () => {
  const load = loader({ globals: { Headers } });
  const { proxy } = load("src/proxy.ts");
  for (const suffix of [
    "",
    "/campaigns",
    "/contacts/contact-a",
    "/import/upload",
    "/settings/email",
  ]) {
    const response = await proxy(
      new NextRequest(
        `https://www.teamalum.com/studio/rmrfootball/admin${suffix}?q=rams`,
        { headers: { "x-teamalum-admin-client": "colts", "x-teamalum-admin-path": "/studio/colts/admin" } },
      ),
    );
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.equal(response.headers.get("x-middleware-request-x-teamalum-admin-path"), `/studio/rmrfootball/admin${suffix}?q=rams`);
    assert.equal(
      response.headers.get("x-middleware-request-x-teamalum-admin-client"),
      "rmrfootball",
    );
  }
  const legacy = await proxy(
    new NextRequest("https://www.teamalum.com/admin", {
      headers: { "x-teamalum-admin-client": "rmrfootball", "x-teamalum-admin-path": "/studio/rmrfootball/admin" },
    }),
  );
  assert.equal(
    legacy.headers.get("x-middleware-request-x-teamalum-admin-client"),
    null,
  );
  assert.equal(legacy.headers.get("x-middleware-request-x-teamalum-admin-path"), null);
  const denied = await proxy(
    new NextRequest(
      "https://www.teamalum.com/studio/rmrfootball/admin/settings/email",
      { method: "POST", headers: { origin: "https://other.teamalum.com" } },
    ),
  );
  assert.equal(denied.status, 403);
  const allowed = await proxy(
    new NextRequest(
      "https://www.teamalum.com/studio/rmrfootball/admin/settings/email",
      { method: "POST", headers: { origin: "https://www.teamalum.com" } },
    ),
  );
  assert.equal(allowed.headers.get("x-middleware-next"), "1");
});
test("owner and admin accounts are authorized per team, while editors, viewers, unlinked and anonymous users are denied", async () => {
  for (const role of ["owner", "admin", "editor", "viewer", null]) {
    const c = context({ role });
    assert.equal(
      await c
        .load("src/lib/team-admin.ts")
        .canManageTeamOperations("rmrfootball"),
      ["owner", "admin"].includes(role),
    );
    assert.ok(
      c.filters.some(
        ([t, k, v]) =>
          t === "client_users" && k === "client_id" && v === "rmrfootball",
      ),
    );
    assert.ok(
      c.filters.some(
        ([t, k, v]) =>
          t === "client_users" && k === "auth_user_id" && v === "user-rams",
      ),
    );
  }
  assert.equal(
    await context({ user: false })
      .load("src/lib/team-admin.ts")
      .canManageTeamOperations("rmrfootball"),
    false,
  );
  assert.equal(
    await context({ user: false, hq: true })
      .load("src/lib/team-admin.ts")
      .canManageTeamOperations("rmrfootball"),
    true,
  );
});
test("workspace reads use the selected team, require access, and preserve the legacy deployment context", async () => {
  assert.equal(
    await context().load("src/lib/team-admin.ts").getWorkspaceClientId(),
    "rmrfootball",
  );
  await assert.rejects(
    context({ role: "viewer" })
      .load("src/lib/team-admin.ts")
      .getWorkspaceClientId(),
    /cannot manage/,
  );
  assert.equal(
    await context({ id: null })
      .load("src/lib/team-admin.ts")
      .getWorkspaceClientId(),
    "colts",
  );
});
test("shared-password admin sessions cannot bypass a namespaced team account check", async () => {
  const load = loader({
    mocks: {
      "@/lib/team-admin": {
        getTeamAdminClientId: async () => "rmrfootball",
        canManageTeamOperations: async () => false,
      },
      "@/lib/supabase/server": { getServerEnvValue: () => "legacy-secret" },
      "next/headers": {
        cookies() {
          throw Error("Legacy cookie must not be consulted");
        },
      },
    },
  });
  assert.equal(
    await load("src/lib/admin-auth.ts").isAdminAuthenticated(),
    false,
  );
});
test("links, sorts and plain forms remain in the selected team without cookie-based team selection", () => {
  const load = loader();
  const { AdminNavigationProvider, AdminLink, AdminForm } = load(
    "src/components/admin-navigation.tsx",
  );
  for (const id of ["rmrfootball", "colts"]) {
    const html = renderToStaticMarkup(
      React.createElement(
        AdminNavigationProvider,
        { clientId: id },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            AdminLink,
            { href: "/admin/campaigns?sort_by=title" },
            "Campaigns",
          ),
          React.createElement(AdminForm, {
            action: "/admin/settings/email",
            method: "post",
          }),
          React.createElement(
            AdminLink,
            { href: "/admin/contacts/a" },
            "Contact",
          ),
        ),
      ),
    );
    assert.match(
      html,
      new RegExp(`/studio/${id}/admin/campaigns\\?sort_by=title`),
    );
    assert.match(
      html,
      new RegExp(`action="/studio/${id}/admin/settings/email"`),
    );
    assert.match(html, new RegExp(`/studio/${id}/admin/contacts/a`));
  }
});
test("actual email settings endpoint writes only to the authorized team and refuses revoked access", async () => {
  for (const role of ["owner", "viewer"]) {
    const c = context({ role });
    const form = new FormData();
    form.set("client_id", "colts");
    form.set("email_from_name", "Rams");
    form.set("email_from_address", "accounts@teamalum.com");
    const res = await c
      .load("src/app/admin/settings/email/route.ts")
      .POST(
        new Request(
          "https://www.teamalum.com/studio/rmrfootball/admin/settings/email",
          {
            method: "POST",
            headers: { accept: "application/json" },
            body: form,
          },
        ),
      );
    assert.equal(res.status, role === "owner" ? 200 : 401);
    assert.equal(c.writes.length, role === "owner" ? 1 : 0);
    if (c.writes.length) assert.equal(c.writes[0][1].client_id, "rmrfootball");
  }
});
test("campaign audiences query only opted-in contacts in the selected workspace", async () => {
  const c = context();
  const queried = [];
  const db = {
    from: (table) => {
      const q = {
        select() {
          return q;
        },
        eq(k, v) {
          queried.push([table, k, v]);
          return q;
        },
        order() {
          return q;
        },
        then(resolve) {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return q;
    },
  };
  const load = loader({
    mocks: {
      ...c.mocks,
      "@/lib/team-admin": c.load("src/lib/team-admin.ts"),
      "@/lib/supabase/server": { createServerSupabaseClient: () => db },
    },
  });
  await load("src/lib/campaign-audience.ts").getAudienceContacts("{}");
  assert.ok(
    queried.some(
      ([t, k, v]) =>
        t === "contacts" && k === "client_id" && v === "rmrfootball",
    ),
  );
  assert.ok(queried.some(([, k, v]) => k === "email_opt_in" && v === true));
});
test("unsubscribe tokens are tied to the intended team and retain compatibility with legacy links", () => {
  // Configure the public URL separately; signing remains client-bound.
  const load = loader({
    mocks: {
      "@/lib/client-context": { getCurrentClientId: () => "colts" },
      "@/lib/supabase/server": {
        getServerEnvValue: (k) =>
          ({
            UNSUBSCRIBE_SECRET: "test-secret",
            NEXT_PUBLIC_SITE_URL: "https://www.teamalum.com",
          })[k],
      },
    },
  });
  const tokenApi = load("src/lib/unsubscribe.ts");
  const link = new URL(
    tokenApi.createUnsubscribeUrl("contact-a", "rmrfootball"),
  );
  const token = link.searchParams.get("token");
  assert.equal(link.searchParams.get("client"), "rmrfootball");
  assert.equal(
    tokenApi.verifyUnsubscribeToken("contact-a", token, "rmrfootball"),
    true,
  );
  assert.equal(
    tokenApi.verifyUnsubscribeToken("contact-a", token, "colts"),
    false,
  );
  assert.equal(
    tokenApi.verifyUnsubscribeToken("contact-b", token, "rmrfootball"),
    false,
  );
  const legacy = new URL(tokenApi.createUnsubscribeUrl("contact-a"));
  assert.equal(
    tokenApi.verifyUnsubscribeToken(
      "contact-a",
      legacy.searchParams.get("token"),
    ),
    true,
  );
});
test("the hub offers the three team-specific tools and hides CRM/mailer links from restricted roles", async () => {
  for (const operations of [true, false]) {
    const load = loader();
    const { TeamHubView } = load("src/components/studio/team-hub.tsx");
    const html = renderToStaticMarkup(
      React.createElement(TeamHubView, {
        client: { id: "rmrfootball", name: "Rocky Mountain Rams Football" },
        operations,
      }),
    );
    assert.match(html, /Rocky Mountain Rams Football/);
    for (const label of ["Edit Site", "CRM &amp; Donors", "Campaign Mailer"])
      assert.ok(html.includes(label));
    assert.ok(html.includes('href="/studio/rmrfootball/content"'));
    assert.equal(html.includes('href="/studio/rmrfootball/admin"'), operations);
    assert.equal(
      html.includes('href="/studio/rmrfootball/admin/campaigns"'),
      operations,
    );
  }
  const c = context();
  const redirect = (path) => {
    throw Error(`REDIRECT:${path}`);
  };
  const load = loader({
    mocks: {
      ...c.mocks,
      "next/navigation": { redirect },
      "@/lib/studio-auth": { hasStudioOrHqSession: async () => false },
      "@/lib/platform-data": {
        getPlatformClientByStudioSlug() {
          throw Error("Unauthorized client lookup");
        },
      },
    },
  });
  await assert.rejects(
    load("src/app/studio/[clientId]/hub/page.tsx").default({
      params: Promise.resolve({ clientId: "rmrfootball" }),
    }),
    /REDIRECT:\/studio\/login\?next=.*rmrfootball.*hub/,
  );
});
test('public ADMIN links enter the correct team hub on the canonical host',()=>{
 for(const [env,expected] of [[{NODE_ENV:'production'},'https://www.teamalum.com'],[{NODE_ENV:'production',TEAMALUM_STUDIO_URL:'https://www.teamalum.com/'},'https://www.teamalum.com'],[{NODE_ENV:'development'},'']]){
  const api=loader({env})('src/lib/studio-navigation.ts');assert.equal(api.teamHubHref('rmrfootball'),expected+'/studio/rmrfootball/hub');
 }
});
test('team logout clears both the Studio cookie and any accompanying HQ session',async()=>{
 const cleared=[];
 const load=loader({mocks:{'@/lib/studio-auth':{clearStudioSession:async()=>cleared.push('studio')},'@/lib/hq-auth':{clearHqSession:async()=>cleared.push('hq')},'next/navigation':{redirect:path=>{throw Error('REDIRECT:'+path);}}}});
 await assert.rejects(load('src/app/studio/logout/route.ts').GET(),/REDIRECT:\/studio\/login/);
 assert.deepEqual(cleared,['studio','hq']);
});
