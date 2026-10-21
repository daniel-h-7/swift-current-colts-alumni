const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const createLoader = require("./helpers/load-ts.cjs");
function harness(client) {
  const calls = [];
  const loader = createLoader({
    mocks: {
      "next/navigation": {
        notFound() {
          throw Error("NOT_FOUND");
        },
      },
      "@/components/site/legends/legends-site": {
        LegendsSite: () => null,
        LegendsSuccess: () => null,
      },
      "@/components/site-not-launched": { SiteNotLaunched: () => null },
      "@/lib/platform-data": {
        getPlatformClient: async (id) => {
          calls.push(["exact", id]);
          return client;
        },
        getPlatformClientByStudioSlug: async (id) => {
          calls.push(["slug", id]);
          return client;
        },
        getClientFeatures: async (id) => {
          calls.push(["features", id]);
          return [];
        },
      },
      "@/lib/site-content": {
        getSiteContentForClient: async (id) => {
          calls.push(["content", id]);
          return {};
        },
      },
      "@/lib/membership-settings": {
        getMembershipSettingsForClient: async (id) => {
          calls.push(["settings", id]);
          return {};
        },
      },
      "@/lib/site-sections": {
        getSiteSections: async (id) => {
          calls.push(["sections", id]);
          return [];
        },
      },
    },
  });
  return { ...loader("src/components/site/client-site-public.tsx"), calls };
}
test("all public client layouts retain the launch gate before fetching content", async () => {
  for (const id of ["unity-warriors", "colts", "rmrfootball", "test-lions"]) {
    const api = harness({ id, name: id, launch_approved_at: null });
    const result = await api.ClientSitePublic({ clientId: id });
    assert.ok(React.isValidElement(result));
    assert.equal(result.props.siteName, id);
    assert.equal(api.calls.length, 1);
    const success = await api.ClientSiteSuccess({ clientId: id });
    assert.equal(success.props.siteName, id);
    assert.equal(api.calls.length, 2);
  }
});
test("public, preview and standalone entry points share Legends and use the resolved tenant data", async () => {
  const api = harness({
    id: "colts",
    name: "Swift Current Colts",
    launch_approved_at: "2026-01-01",
  });
  const live = await api.ClientSitePublic({
    clientId: "sccoltsfootball",
    showJoin: true,
    standalone: true,
  });
  assert.equal(live.props.client.id, "colts");
  assert.equal(live.props.showJoin, true);
  assert.equal(live.props.manageHref, "/membership/manage");
  assert.equal(api.calls[0][0], "slug");
  for (const [kind, id] of api.calls.slice(1)) assert.equal(id, "colts", kind);
  const preview = await api.ClientSitePublic({
    clientId: "colts",
    preview: true,
  });
  assert.equal(preview.props.preview, true);
  assert.equal(preview.props.manageHref, undefined);
  assert.ok(api.calls.some(([kind]) => kind === "exact"));
});
test("unapproved clients can preview their design, while a missing preview is a 404", async () => {
  const api = harness({
    id: "new-site",
    name: "New Site",
    launch_approved_at: null,
  });
  const preview = await api.ClientSitePublic({
    clientId: "new-site",
    preview: true,
  });
  assert.equal(preview.props.client.id, "new-site");
  await assert.rejects(
    harness(null).ClientSitePublic({ clientId: "missing", preview: true }),
    /NOT_FOUND/,
  );
});
