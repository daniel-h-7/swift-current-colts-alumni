const { test } = require("node:test");
const assert = require("node:assert/strict");
const loader = require("./helpers/load-ts.cjs");
test("logout links use document navigation even when prefetch was requested", () => {
  const { AuthNavigationLink } = loader()(
    "src/components/auth-navigation-link.tsx",
  );
  for (const href of [
    "/studio/logout",
    "/hq/logout",
    "/admin/logout",
    "/studio/rmrfootball/admin/logout",
  ]) {
    const element = AuthNavigationLink({
      href,
      children: "Log Out",
      prefetch: true,
      className: "menu-link",
    });
    assert.equal(element.type, "a");
    assert.equal(element.props.href, href);
    assert.equal(element.props.className, "menu-link");
    assert.equal(element.props.prefetch, undefined);
  }
  assert.notEqual(
    AuthNavigationLink({
      href: "/studio/rmrfootball/content",
      children: "Edit Site",
    }).type,
    "a",
  );
});
test("background logout requests never clear Studio, HQ, or legacy admin sessions", async () => {
  const background = [
    { rsc: "1" },
    { "next-router-prefetch": "1" },
    { purpose: "prefetch" },
    { "sec-purpose": "prefetch;prerender" },
  ];
  for (const area of ["studio", "hq", "admin"])
    for (const headers of background) {
      const unexpected = async () => {
        throw Error("A background request must not touch authentication");
      };
      const load = loader({
        mocks: {
          "@/lib/studio-auth": { clearStudioSession: unexpected },
          "@/lib/hq-auth": { clearHqSession: unexpected },
          "@/lib/admin-auth": { clearAdminSession: unexpected },
          "@/lib/team-admin": {
            getTeamAdminClientId: unexpected,
            adminPath: unexpected,
          },
        },
      });
      const response = await load(`src/app/${area}/logout/route.ts`).GET(
        new Request(`https://www.teamalum.com/${area}/logout`, { headers }),
      );
      assert.equal(response.status, 204);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.match(response.headers.get("cache-control"), /no-store/);
    }
});
test("deliberate Studio logout still clears sessions and returns to login", async () => {
  const cleared = [];
  const load = loader({
    mocks: {
      "@/lib/studio-auth": {
        clearStudioSession: async () => cleared.push("studio"),
      },
      "@/lib/hq-auth": { clearHqSession: async () => cleared.push("hq") },
      "next/navigation": {
        redirect: (path) => {
          throw Error("REDIRECT:" + path);
        },
      },
    },
  });
  await assert.rejects(
    load("src/app/studio/logout/route.ts").GET(
      new Request("https://www.teamalum.com/studio/logout"),
    ),
    /REDIRECT:\/studio\/login/,
  );
  assert.deepEqual(cleared, ["studio", "hq"]);
});
test("expired CRM sessions return to the exact tool and filters after login", async () => {
  for (const path of [
    "/studio/rmrfootball/admin",
    "/studio/rmrfootball/admin/campaigns?sort_by=title",
    "/studio/rmrfootball/admin/contacts/contact-a",
  ]) {
    const load = loader({
      mocks: {
        "next/headers": {
          headers: async () =>
            new Headers({
              "x-teamalum-admin-client": "rmrfootball",
              "x-teamalum-admin-path": path,
            }),
        },
        "@/lib/studio-auth": {},
        "@/lib/hq-auth": {},
        "@/lib/supabase/server": {},
        "@/lib/client-context": {},
        "@/lib/platform-data": {},
      },
    });
    const dest = await load("src/lib/team-admin.ts").adminPath("/admin/login");
    assert.equal(
      new URL(dest, "https://www.teamalum.com").searchParams.get("next"),
      path,
    );
  }
});
