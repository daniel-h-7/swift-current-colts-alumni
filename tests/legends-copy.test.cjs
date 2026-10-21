const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextResponse } = require("next/server");
const createLoader = require("./helpers/load-ts.cjs");
const load = createLoader({
  mocks: {
    "@/lib/platform-data": {},
    "@/lib/client-context": {},
    "@/lib/supabase/server": {},
  },
});
const { getLegendsCopy, legendsCopyFromForm } = load("src/lib/legends-copy.ts");
const { createStarterSiteContent, normalizeSiteContent } = load(
  "src/lib/site-content.ts",
);
const { defaultSiteSections } = load("src/lib/site-sections-shared.ts");
test("existing sites receive the new support and alumni defaults without a database migration", () => {
  const copy = getLegendsCopy(
    "Unity Warriors Football",
    undefined,
    "unity-warriors",
  );
  assert.equal(copy.supportButton, "Support the Team");
  assert.equal(copy.supportMenu, "Support Now");
  assert.equal(copy.alumniEyebrow, "Alumni Spotlight");
  assert.equal(copy.inviteTitle, "Still a Warrior.");
  assert.match(getLegendsCopy("Lions").storyLead, /Lions/);
});
test("edits survive normalization and clearing one field restores only that default", () => {
  const original = createStarterSiteContent("Lions");
  original.legends = {
    storyTitle: "Our people",
    storyBody: "An enduring connection.",
    eventsTitle: "Meet again",
  };
  const form = new FormData();
  form.set("legends_storyTitle", "New chapter");
  form.set("legends_storyBody", "  ");
  const saved = legendsCopyFromForm(form, "Lions", original.legends);
  const normalized = normalizeSiteContent(
    { ...original, legends: saved },
    "lions",
    original,
  );
  assert.equal(normalized.legends.storyTitle, "New chapter");
  assert.equal(normalized.legends.eventsTitle, "Meet again");
  assert.match(normalized.legends.storyBody, /Former players/);
  assert.equal(original.legends.storyTitle, "Our people");
  assert.equal(
    getLegendsCopy("Lions", { storyTitle: { bad: true }, eventsTitle: 123 })
      .storyTitle,
    "More than",
  );
});
function renderers() {
  return createLoader({
    mocks: {
      "next/link": ({ children, ...props }) =>
        React.createElement("a", props, children),
      "./legends-site.module.css": {},
      "@/components/join-form": { JoinForm: () => React.createElement("form") },
      "@/components/support-share-bar": { SupportShareBar: () => null },
    },
  })("src/components/site/legends/legends-site.tsx");
}
test("custom section, support-page and thank-you text renders safely with unchanged destinations", () => {
  const { LegendsSite, LegendsSuccess } = renderers();
  const content = createStarterSiteContent("Lions");
  content.legends = {
    storyTitle: "Our people",
    storyBody: "<script>alert(1)</script>",
    joinTitle: "Stay involved",
    successTitle: "Thank you, Lions",
    alumniEyebrow: "Alumni Spotlight",
  };
  const props = {
    client: { id: "lions", name: "Lions" },
    content,
    settings: {
      annual_membership_amount_cents: 10000,
      join_is_open: true,
      membership_year_label: "Lions",
    },
    features: [],
    sections: defaultSiteSections,
  };
  const home = renderToStaticMarkup(React.createElement(LegendsSite, props));
  assert.match(home, /Our people/);
  assert.match(home, /&lt;script&gt;/);
  assert.doesNotMatch(home, /<script>/);
  assert.match(home, /Support the Team/);
  assert.match(home, /Support Now/);
  assert.match(home, /href="\/join"/);
  assert.match(
    renderToStaticMarkup(
      React.createElement(LegendsSite, { ...props, showJoin: true }),
    ),
    /Stay involved/,
  );
  assert.match(
    renderToStaticMarkup(React.createElement(LegendsSuccess, props)),
    /Thank you, Lions/,
  );
});
test("Studio saves section wording without replacing saved stats or unrelated membership settings", async () => {
  let written, member;
  const original = createStarterSiteContent("Lions");
  original.impactStats = [{ value: "25", label: "Years" }];
  original.sponsors = Array.from({length:4}, (_,i)=>({name:`Partner ${i+1}`,imageUrl:"",linkUrl:""}));
  original.events = Array.from({length:3}, (_,i)=>({title:`Event ${i+1}`,date:"",notes:"",imageUrl:"",linkUrl:"",linkLabel:""}));
  original.legends = { eventsTitle: "Gather again" };
  const membership = {
    join_headline: "My form title",
    join_body: "My form body",
    membership_year_label: "Lions Supporters",
  };
  const api = createLoader({
    mocks: {
      "next/server": { NextResponse },
      "next/cache": { revalidatePath() {} },
      "@/lib/studio-auth": { canAccessStudioClient: async () => true },
      "@/lib/setup-state": { updateSetupState: async () => {} },
      "@/lib/supabase/server": {},
      "@/lib/site-content": {
        createStarterSiteContent,
        getSiteContentForClient: async () => original,
        saveSiteContentForClient: async (id, content, settings) => {
          written = content;
          member = settings;
        },
      },
      "@/lib/membership-settings": {
        getMembershipSettingsForClient: async () => membership,
      },
    },
  })("src/app/studio/[clientId]/content/save/route.ts");
  const form = new FormData();
  form.set("site_title", "Lions");
  form.set("legends_storyTitle", "Our Lions");
  const response = await api.POST(
    new Request("https://teamalum.com/studio/lions/content/save", {
      method: "POST",
      body: form,
    }),
    { params: Promise.resolve({ clientId: "lions" }) },
  );
  assert.match(response.headers.get("location"), /saved=content/);
  assert.equal(written.legends.storyTitle, "Our Lions");
  assert.equal(written.legends.eventsTitle, "Gather again");
  assert.equal(written.impactStats[0].value, "25");
  assert.equal(written.sponsors[0].name,"Partner 4");
  assert.equal(written.events[0].title,"Event 3");
  assert.equal(member.joinHeadline, "My form title");
  assert.equal(member.joinBody, "My form body");
  assert.equal(member.membershipYearLabel, "Lions Supporters");
});
test("the legacy content editor serializes branding alongside the editable defaults", () => {
  const original = createStarterSiteContent("Lions");
  original.brand.primaryColor = "#123456";
  const { SiteContentForm } = createLoader({
    mocks: {
      "@/components/legends-copy-fields": { LegendsCopyFields: () => null },
    },
  })("src/components/site-content-form.tsx");
  const html = renderToStaticMarkup(
    React.createElement(SiteContentForm, { content: original, saved: false }),
  );
  const encoded = html.match(/name="site_content"[^>]*value="([^"]*)"/)[1];
  const decoded = encoded
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
  const payload = JSON.parse(decoded);
  assert.equal(payload.brand.primaryColor, "#123456");
  assert.equal(payload.brand.siteTitle, "Lions");
  assert.equal(payload.legends.alumniEyebrow, "Alumni Spotlight");
  assert.equal(payload.legends.supportButton, "Support the Team");
});
test("legacy admin saves wording without replacing existing branding", async () => {
  const original = createStarterSiteContent("Lions");
  original.brand.primaryColor = "#123456";
  let written;
  const api = createLoader({
    mocks: {
      "next/server": { NextResponse },
      "next/cache": { revalidatePath() {} },
      "@/lib/admin-auth": { isAdminAuthenticated: async () => true },
      "@/lib/client-context": { getCurrentClientId: () => "lions" },
      "@/lib/site-content": {
        getSiteContent: async () => original,
        normalizeSiteContent,
      },
      "@/lib/supabase/server": {
        createServerSupabaseClient: () => ({
          from: () => ({
            upsert: async (value) => {
              written = value;
              return { error: null };
            },
          }),
        }),
      },
    },
  })("src/app/admin/settings/site-content/save/route.ts");
  const form = new FormData();
  form.set(
    "site_content",
    JSON.stringify({ legends: { storyTitle: "Our people" } }),
  );
  const response = await api.POST(
    new Request("https://lions.example.test/admin/settings/site-content/save", {
      method: "POST",
      body: form,
    }),
  );
  assert.match(response.headers.get("location"), /saved=1/);
  assert.equal(written.client_id, "lions");
  assert.equal(written.site_content.brand.primaryColor, "#123456");
  assert.equal(written.site_content.legends.storyTitle, "Our people");
});
