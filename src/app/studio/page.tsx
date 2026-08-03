import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";
import { getCurrentClientId } from "@/lib/client-context";
import { getEmailSettings } from "@/lib/email-settings";
import {
  formatMembershipAmount,
  getMembershipSettings,
} from "@/lib/membership-settings";
import { getSiteBrand } from "@/lib/site-brand";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const featureGroups = [
  {
    description: "Membership signup, renewal status, checkout, and supporter records.",
    enabled: true,
    label: "Memberships",
  },
  {
    description: "Sponsor logos, links, and partner placement on the public site.",
    enabled: true,
    label: "Sponsors",
  },
  {
    description: "Upcoming dates, event links, and homepage calendar highlights.",
    enabled: true,
    label: "Events",
  },
  {
    description: "Alumni profiles, photos, class years, and spotlight copy.",
    enabled: true,
    label: "Spotlights",
  },
  {
    description: "Campaign pages, target totals, progress, and calls to action.",
    enabled: false,
    label: "Fundraising Campaigns",
  },
  {
    description: "Email campaigns and audience segments from the CRM.",
    enabled: false,
    label: "Broadcasts",
  },
];

const setupItems = [
  "Create organization",
  "Choose site template",
  "Add homepage content",
  "Upload logo and photos",
  "Connect Stripe",
  "Publish domain",
];

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] ${
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {enabled ? "On" : "Planned"}
    </span>
  );
}

export default async function StudioPage() {
  const [settings, emailSettings, siteContent] = await Promise.all([
    getMembershipSettings(),
    getEmailSettings(),
    getSiteContent(),
  ]);
  const brand = getSiteBrand();
  const completedSetup = 3;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <StudioHeader
        actions={[
          { href: "/studio", label: "Builder", tone: "primary" },
          { href: "/admin/settings/site-content", label: "Content" },
          { href: "/hq", label: "HQ" },
        ]}
        subtitle="The client-facing workspace for building and managing a TeamAlum site."
        title={`${brand.programName} Site Builder`}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Site
                </p>
                <h2 className="mt-2 text-2xl font-black">{brand.metaTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  {brand.metaDescription}
                </p>
              </div>
              <Link
                className="inline-flex border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                href="/"
              >
                Preview Site
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Client
                </p>
                <p className="mt-2 font-mono text-sm font-bold">
                  {getCurrentClientId()}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Template
                </p>
                <p className="mt-2 text-sm font-bold">{brand.variant}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Membership
                </p>
                <p className="mt-2 text-sm font-bold">
                  {settings.join_is_open ? "Open" : "Closed"}
                </p>
              </div>
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black">Feature Controls</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Available modules for this site template.
                </p>
              </div>
              <span className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                HQ Managed
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {featureGroups.map((feature) => (
                <div
                  className="border border-slate-200 bg-slate-50 p-4"
                  key={feature.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-black">{feature.label}</h3>
                    <StatusPill enabled={feature.enabled} />
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black">Homepage Content</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Current content blocks connected to the public template.
                </p>
              </div>
              <Link
                className="inline-flex border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                href="/admin/settings/site-content"
              >
                Edit Content
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Sponsors
                </p>
                <p className="mt-2 text-2xl font-black">
                  {siteContent.sponsors.length}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Events
                </p>
                <p className="mt-2 text-2xl font-black">
                  {siteContent.events.length}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Spotlights
                </p>
                <p className="mt-2 text-2xl font-black">
                  {siteContent.spotlights.length}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Campaigns
                </p>
                <p className="mt-2 text-2xl font-black">
                  {siteContent.fundraisingCampaigns.length}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Setup</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {completedSetup} of {setupItems.length} complete
            </p>
            <div className="mt-4 h-2 bg-slate-100">
              <div
                className="h-2 bg-emerald-600"
                style={{
                  width: `${Math.round((completedSetup / setupItems.length) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-5 space-y-3">
              {setupItems.map((item, index) => (
                <div
                  className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 px-4 py-3"
                  key={item}
                >
                  <span className="text-sm font-bold">{item}</span>
                  <span
                    className={`text-xs font-black uppercase tracking-[0.16em] ${
                      index < completedSetup
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {index < completedSetup ? "Done" : "Next"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Payments</h2>
            <div className="mt-4 space-y-4">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Annual Amount
                </p>
                <p className="mt-2 text-xl font-black">
                  {formatMembershipAmount(settings)}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Stripe Connect
                </p>
                <p className="mt-2 text-sm font-bold text-amber-700">
                  Not connected
                </p>
              </div>
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Messaging</h2>
            <div className="mt-4 border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                From
              </p>
              <p className="mt-2 break-words text-sm font-bold">
                {emailSettings.email_from_name} &lt;
                {emailSettings.email_from_address}&gt;
              </p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
