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
const { usesUnityPilot, unityPresentation, pilotColors, safePilotLink } = load(
  "src/lib/unity-pilot.ts",
);
const features = [
  { feature_key: "memberships", is_enabled: true },
  { feature_key: "fundraising_campaigns", is_enabled: true },
];
const now = new Date("2026-10-20T12:00:00Z");
const content = () => createStarterSiteContent("Unity Warriors Football");

test("only the exact Unity client opts into the pilot", () => {
  assert.equal(usesUnityPilot({ id: "unity-warriors" }), true);
  for (const id of ["colts", "rmrfootball", "unity-warriors-copy", "demo"])
    assert.equal(usesUnityPilot({ id }), false);
});
test("starter-only content produces a complete evergreen site without fabricated sponsor, alumni or campaign claims", () => {
  const result = unityPresentation(
    content(),
    features,
    defaultSiteSections,
    now,
  );
  assert.equal(result.memberships, true);
  for (const field of ["events", "sponsors", "spotlights", "campaigns"])
    assert.equal(result[field].length, 0);
});
test("past events retire automatically, seasonal announcements remain, and configured content is preserved", () => {
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
  const result = unityPresentation(saved, features, defaultSiteSections, now);
  assert.deepEqual(
    Array.from(result.events, (e) => e.title),
    ["Today", "Reunion", "Future"],
  );
  assert.equal(result.sponsors.length, 1);
  assert.equal(result.spotlights.length, 1);
  assert.equal(result.campaigns.length, 1);
  assert.equal(JSON.stringify(saved), before);
  const hidden = unityPresentation(
    saved,
    features.map((f) => ({ ...f, is_enabled: false })),
    defaultSiteSections.map((s) => ({ ...s, is_enabled: false })),
    now,
  );
  assert.equal(hidden.memberships, false);
  for (const field of ["events", "sponsors", "spotlights", "campaigns"])
    assert.equal(hidden[field].length, 0);
});
test("pilot links and brand colors have safe, readable fallbacks", () => {
  for (const href of [
    "javascript:alert(1)",
    "//evil.example",
    "/\\evil.example",
    "data:text/html,hi",
  ])
    assert.equal(safePilotLink(href), null);
  assert.equal(safePilotLink("/join"), "/join");
  assert.equal(
    safePilotLink("https://example.com/event"),
    "https://example.com/event",
  );
  assert.equal(pilotColors("#ffffff", "#ffffff").onBrand, "#171917");
  assert.equal(pilotColors("#000000", "#ffffff").onBrand, "#ffffff");
  assert.equal(pilotColors("red; color:white", "bad").brand, "#785d25");
});
function component() {
  return createLoader({
    mocks: {
      "next/link": ({ children, ...props }) =>
        React.createElement("a", props, children),
      "./unity-site.module.css": Object.fromEntries(
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
      "@/components/join-form": {
        JoinForm: (props) =>
          React.createElement("form", {
            "data-checkout": props.checkoutPath,
            "data-open": String(props.isOpen),
          }),
      },
    },
  })("src/components/site/unity/unity-site.tsx");
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
  const { UnitySite } = component();
  const html = renderToStaticMarkup(
    React.createElement(UnitySite, { ...props(), preview: true }),
  );
  assert.match(html, /Once a Warrior/);
  assert.match(html, /More than/);
  assert.match(html, /href="\/preview\/unity-warriors\/join"/);
  assert.match(html, /href="\/studio\/unity-warriors\/content"/);
  for (const id of ["events", "alumni", "sponsors", "support"])
    assert.doesNotMatch(html, new RegExp(`href="#${id}"`));
  assert.doesNotMatch(html, /\$6,250|Alumni Spotlight|Founding Sponsor/);
});
test("join keeps production and preview checkout boundaries and disables memberships when switched off", () => {
  const { UnitySite } = component();
  const preview = renderToStaticMarkup(
    React.createElement(UnitySite, {
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
    React.createElement(UnitySite, {
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
