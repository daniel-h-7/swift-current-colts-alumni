const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const createLoader = require("./helpers/load-ts.cjs");
const load = createLoader({
  mocks: {
    "@/lib/platform-data": {},
    "@/lib/client-context": {},
    "@/lib/supabase/server": {},
  },
});
const { createStarterSiteContent } = load("src/lib/site-content.ts");
const { defaultSiteSections } = load("src/lib/site-sections-shared.ts");
const { legendsIdentity, legendsPresentation, legendsColors, safeLegendsLink } =
  load("src/lib/legends.ts");
const features = [
  { feature_key: "memberships", is_enabled: true },
  { feature_key: "fundraising_campaigns", is_enabled: true },
];
const content = () => createStarterSiteContent("Unity Warriors Football");

test("identity is derived separately for every organization", () => {
  assert.equal(legendsIdentity("Unity Warriors Football").initials, "UW");
  assert.equal(legendsIdentity("Rocky Mountain Rams Football").initials, "RMR");
  assert.equal(legendsIdentity("Swift Current Colts Football").initials, "SCC");
  assert.equal(legendsIdentity("Football Alumni Club").initials, "T");
});
test("starter-only content produces a complete evergreen site without fabricated sponsor, alumni or campaign claims", () => {
  const result = legendsPresentation(
    content(),
    features,
    defaultSiteSections,
  );
  assert.equal(result.memberships, true);
  for (const field of ["events", "sponsors", "spotlights", "campaigns"])
    assert.equal(result[field].length, 0);
});
test("enabled events keep their saved dates, order and content until the editor hides them", () => {
  const saved = content();
  saved.events = [
    { title: "Last year", date: "October 19, 2026" },
    { title: "Today", date: "2026-10-20" },
    { title: "Reunion", date: "Fall 2027" },
    { title: "Future", date: "October 21, 2026" },
  ].map((e) => ({ ...e, notes: "", linkUrl: "", linkLabel: "", imageUrl: "" }));
  saved.sponsors = [
    { name: "Founding Sponsor", imageUrl: "/real-logo.svg", linkUrl: "" },
  ];
  saved.spotlights = [
    {
      name: "Jordan Smith",
      descriptor: "Warriors alumni",
      classYear: "2010",
      imageUrl: "",
      imageClass: "",
    },
  ];
  saved.fundraisingCampaigns[0].description = "A real program campaign";
  const before = JSON.stringify(saved);
  const result = legendsPresentation(saved, features, defaultSiteSections);
  assert.deepEqual(
    Array.from(result.events, (e) => e.title),
    ["Last year", "Today", "Reunion", "Future"],
  );
  assert.equal(result.sponsors.length, 1);
  assert.equal(result.spotlights.length, 1);
  assert.equal(result.campaigns.length, 1);
  assert.equal(JSON.stringify(saved), before);
  const hidden = legendsPresentation(
    saved,
    features.map((f) => ({ ...f, is_enabled: false })),
    defaultSiteSections.map((s) => ({ ...s, is_enabled: false })),
  );
  assert.equal(hidden.memberships, false);
  for (const field of ["events", "sponsors", "spotlights", "campaigns"])
    assert.equal(hidden[field].length, 0);
});
test("Legends links and brand colors have safe, readable fallbacks", () => {
  for (const href of [
    "javascript:alert(1)",
    "//evil.example",
    "/\\evil.example",
    "data:text/html,hi",
  ])
    assert.equal(safeLegendsLink(href), null);
  assert.equal(safeLegendsLink("/join"), "/join");
  assert.equal(
    safeLegendsLink("https://example.com/event"),
    "https://example.com/event",
  );
  assert.equal(legendsColors("rgb(29, 78, 216)", "#ffffff").brand, "#1d4ed8");
  assert.equal(legendsColors("#ffffff", "#ffffff").onBrand, "#171917");
  assert.equal(legendsColors("#000000", "#ffffff").onBrand, "#ffffff");
  assert.equal(legendsColors("red; color:white", "bad").brand, "#785d25");
});
function component() {
  return createLoader({
    mocks: {
      "next/link": ({ children, ...props }) =>
        React.createElement("a", props, children),
      "./legends-site.module.css": Object.fromEntries(
        [
          "site",
          "preview",
          "header",
          "identity",
          "logo",
          "monogram",
          "largeMonogram",
          "button",
          "sectionNav",
          "hero",
          "heroCopy",
          "heroVisual",
          "heroEmblem",
          "photoShade",
          "photoWord",
          "photoCaption",
          "eyebrow",
          "textLink",
          "heroActions",
          "story",
          "storyIntro",
          "storyBody",
          "lead",
          "storyWatermark",
          "invite",
          "inviteInner",
          "inviteBottom",
          "inviteMark",
          "price",
          "footer",
          "joinLayout",
          "joinAside",
          "joinPrice",
          "finePrint",
          "joinForm",
          "success",
          "thanksScript",
        ].map((n) => [n, n]),
      ),
      "@/components/support-share-bar": {
        SupportShareBar: (props) =>
          React.createElement("div", { "data-share": props.shareText }),
      },
      "@/components/join-form": {
        JoinForm: (props) =>
          React.createElement("form", {
            "data-checkout": props.checkoutPath,
            "data-open": String(props.isOpen),
          }),
      },
    },
  })("src/components/site/legends/legends-site.tsx");
}
const settings = {
  annual_membership_amount_cents: 10000,
  membership_year_label: "Warriors",
  join_is_open: true,
  join_headline: "Join us",
  join_body: "Support the program",
};
const props = () => ({
  client: { id: "unity-warriors", name: "Unity Warriors Football" },
  content: content(),
  settings,
  features,
  sections: defaultSiteSections,
});
test("sparse homepage has no empty section links; preview retains organization-scoped join and editor routes", () => {
  const { LegendsSite } = component();
  const html = renderToStaticMarkup(
    React.createElement(LegendsSite, { ...props(), preview: true }),
  );
  assert.match(html, /Support Unity Warriors Football/);
  assert.match(html, /More than/);
  assert.match(html, /href="\/preview\/unity-warriors\/join"/);
  assert.match(html, /href="\/studio\/unity-warriors\/content"/);
  for (const id of ["events", "alumni", "sponsors", "support"])
    assert.doesNotMatch(html, new RegExp(`href="#${id}"`));
  assert.doesNotMatch(html, /\$6,250|Alumni Spotlight|Founding Sponsor/);
});
test("public and preview honor enabled events, uploaded artwork, saved hero copy and section order", () => {
  const { LegendsSite } = component();
  const saved = content();
  saved.events = [{ title: "Rams reunion", date: "September 12, 2020", notes: "Meet at the field", imageUrl: "/uploads/reunion-poster.jpg", linkUrl: "https://example.com/reunion", linkLabel: "Reunion details" }];
  saved.sponsors = [{ name: "Local supporter", imageUrl: "", linkUrl: "" }];
  const sections = [
    ...defaultSiteSections.filter((s) => s.section_key === "events"),
    ...defaultSiteSections.filter((s) => s.section_key !== "events"),
  ];
  for (const preview of [false, true]) {
    const input = { ...props(), content: saved, sections, preview };
    const html = renderToStaticMarkup(React.createElement(LegendsSite, input));
    assert.match(html, /href="#events"/);
    assert.match(html, /Rams reunion/);
    assert.match(html, /September 12, 2020/);
    assert.match(html, /src="\/uploads\/reunion-poster.jpg"/);
    assert.match(html, /Meet at the field/);
    assert.match(html, /href="https:\/\/example.com\/reunion"/);
    assert.match(html, /Reunion details/);
    assert.match(html, /<h1>Support Unity Warriors Football<\/h1>/);
    assert.ok(html.includes(saved.brand.heroBody));
    assert.ok(html.indexOf('id="events"') < html.indexOf('id="sponsors"'));
    for (const hidden of [
      { ...input, features: [...features, { feature_key: "events", is_enabled: false }] },
      { ...input, sections: sections.map((s) => ({ ...s, is_enabled: s.section_key !== "events" })) },
    ]) {
      const output = renderToStaticMarkup(React.createElement(LegendsSite, hidden));
      assert.doesNotMatch(output, /href="#events"|Rams reunion|reunion-poster/);
    }
  }
});
test("join keeps production and preview checkout boundaries and disables memberships when switched off", () => {
  const { LegendsSite } = component();
  const preview = renderToStaticMarkup(
    React.createElement(LegendsSite, {
      ...props(),
      preview: true,
      showJoin: true,
    }),
  );
  assert.match(
    preview,
    /data-checkout="\/preview\/unity-warriors\/api\/membership\/checkout"/,
  );
  const live = renderToStaticMarkup(
    React.createElement(LegendsSite, {
      ...props(),
      showJoin: true,
      features: [{ feature_key: "memberships", is_enabled: false }],
    }),
  );
  assert.match(
    live,
    /data-checkout="\/site\/unity-warriors\/api\/membership\/checkout"/,
  );
  assert.match(live, /data-open="false"/);
});

test("Legends renders every tenant with saved copy and branding and no Unity leakage", () => {
  const { LegendsSite, LegendsSuccess } = component();
  for (const [id, name, color] of [
    ["rmrfootball", "Rocky Mountain Rams Football", "#ceb74c"],
    ["colts", "Swift Current Colts Football", "#dc2626"],
    ["demo", "Northwest Yetis", "#c5a45b"],
    ["bfbadgers", "Bonners Ferry Badgers Football", "#1d4ed8"],
    ["test-lions", "Lakeside Lions", "#fff000"],
  ]) {
    const saved = createStarterSiteContent(name);
    saved.brand.primaryColor = color;
    saved.brand.logoUrl = `/images/${id}-logo.png`;
    saved.brand.heroTitle = `A custom ${name} headline`;
    saved.brand.heroBody = `Saved body for ${name}`;
    const input = {
      ...props(),
      client: { id, name },
      content: saved,
      settings: { ...settings, membership_year_label: name },
    };
    const before = JSON.stringify(input);
    for (const view of [
      React.createElement(LegendsSite, input),
      React.createElement(LegendsSite, {
        ...input,
        showJoin: true,
        preview: true,
      }),
      React.createElement(LegendsSuccess, {
        confirmation: "confirmed",
        client: input.client,
        content: saved,
        manageHref: "/membership/manage",
      }),
    ]) {
      const html = renderToStaticMarkup(view);
      assert.match(html, new RegExp(name));
      assert.match(html, new RegExp(`/images/${id}-logo.png`));
      assert.doesNotMatch(html, /Unity|Warrior|>UW</);
      assert.match(html, new RegExp(color));
    }
    const html = renderToStaticMarkup(React.createElement(LegendsSite, input));
    assert.match(html, new RegExp(saved.brand.heroTitle));
    assert.match(html, new RegExp(saved.brand.heroBody));
    assert.equal(JSON.stringify(input), before);
  }
});
test("existing membership management and sharing entry points remain on standalone pages", () => {
  const { LegendsSite, LegendsSuccess } = component();
  const join = renderToStaticMarkup(
    React.createElement(LegendsSite, {
      ...props(),
      showJoin: true,
      manageHref: "/membership/manage",
    }),
  );
  assert.match(join, /href="\/membership\/manage"/);
  const success = renderToStaticMarkup(
    React.createElement(LegendsSuccess, {
        confirmation: "confirmed",
      ...props(),
      manageHref: "/membership/manage",
    }),
  );
  assert.match(success, /href="\/membership\/manage"/);
  assert.match(
    success,
    /data-share="Join me in supporting Unity Warriors Football/,
  );
});

test("generic organizations with partial content use their own identity, never a legacy club fallback", () => {
  const { normalizeSiteContent } = load("src/lib/site-content.ts");
  const fallback = createStarterSiteContent("Lakeside Lions");
  const normalized = normalizeSiteContent(
    { brand: { primaryColor: "#123456" }, sponsors: [] },
    "lakeside-lions",
    fallback,
  );
  assert.equal(normalized.brand.siteTitle, "Lakeside Lions");
  assert.equal(normalized.brand.primaryColor, "#123456");
  assert.equal(normalized.sponsors.length, 0);
  assert.match(normalized.brand.heroBody, /Lakeside Lions/);
});

test('success copy and sharing require an explicitly confirmed payment', () => {
  const { LegendsSuccess } = component();
  const unverified = renderToStaticMarkup(React.createElement(LegendsSuccess, { ...props(), manageHref: '/membership/manage' }));
  assert.doesNotMatch(unverified, /Membership complete|data-share=/);
  assert.match(unverified, /couldn’t confirm a completed payment/);
  const pending = renderToStaticMarkup(React.createElement(LegendsSuccess, { ...props(), confirmation: 'pending' }));
  assert.match(pending, /Payment processing/);
  assert.doesNotMatch(pending, /Membership complete/);
});
