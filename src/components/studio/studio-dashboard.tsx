import Link from "next/link";
import { FeatureSettingsForm } from "@/components/studio/feature-settings-form";
import { StudioHeader } from "@/components/studio-header";
import { getEmailSettingsForClient } from "@/lib/email-settings";
import {
  formatMembershipAmount,
  getMembershipSettingsForClient,
} from "@/lib/membership-settings";
import {
  getClientFeatures,
  getClientIntegrations,
  getIntegrationStatus,
  PlatformClient,
} from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { getSiteSections } from "@/lib/site-sections";

const setupItems = [
  "Create organization",
  "Choose site template",
  "Add homepage content",
  "Upload logo and photos",
  "Connect Stripe",
  "Publish domain",
];

export async function StudioDashboard({
  client,
  isCreated = false,
}: {
  client: PlatformClient;
  isCreated?: boolean;
}) {
  const [settings, emailSettings, siteContent, features, integrations, sections] =
    await Promise.all([
      getMembershipSettingsForClient(client.id),
      getEmailSettingsForClient(client.id),
      getSiteContentForClient(client.id),
      getClientFeatures(client.id),
      getClientIntegrations(client.id),
      getSiteSections(client.id),
    ]);
  const stripeStatus = getIntegrationStatus(integrations, "stripe_connect");
  const customDomainStatus = getIntegrationStatus(integrations, "custom_domain");
  const completedSetup =
    3 + (stripeStatus === "connected" ? 1 : 0) +
    (customDomainStatus === "connected" ? 1 : 0);
  const previewHref = `/preview/${encodeURIComponent(client.id)}`;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <StudioHeader
        actions={[
          { href: `/studio/${client.id}`, label: "Builder", tone: "primary" },
          { href: "/studio/start", label: "Start Site" },
          { href: "/studio/logout", label: "Log Out" },
        ]}
        subtitle="The client-facing workspace for building and managing a TeamAlum site."
        title={`${client.name} Site Builder`}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {isCreated ? (
            <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Site workspace created. Continue setup below.
            </div>
          ) : null}

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Site
                </p>
                <h2 className="mt-2 text-2xl font-black">{client.name}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  {client.subdomain
                    ? `${client.subdomain}.teamalum.com`
                    : client.custom_domain || client.primary_domain || client.id}
                </p>
              </div>
              <Link
                className="inline-flex border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                href={previewHref}
              >
                Preview Site
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Client
                </p>
                <p className="mt-2 font-mono text-sm font-bold">{client.id}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Plan
                </p>
                <p className="mt-2 text-sm font-bold">
                  {client.plan_key ?? "starter"}
                </p>
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

          <FeatureSettingsForm
            action={`/studio/${encodeURIComponent(client.id)}/features`}
            features={features}
            sections={sections}
          />

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
                href={`/studio/${client.id}/content`}
              >
                Continue to Edit Content
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                ["Sponsors", siteContent.sponsors.length],
                ["Events", siteContent.events.length],
                ["Spotlights", siteContent.spotlights.length],
                ["Campaigns", siteContent.fundraisingCampaigns.length],
              ].map(([label, value]) => (
                <div className="border border-slate-200 bg-slate-50 p-4" key={label}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
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
              <div className="border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  TeamAlum Access
                </p>
                <p className="mt-2 text-xl font-black">$360 / year</p>
                <p className="mt-2 text-xs font-bold leading-5 text-emerald-800">
                  Planned as $30/month, billed annually. If your site does not
                  raise enough to cover the fee, the site is on us.
                </p>
              </div>
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
                <p
                  className={`mt-2 text-sm font-bold ${
                    stripeStatus === "connected"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {stripeStatus.replaceAll("_", " ")}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Domain
                </p>
                <p
                  className={`mt-2 text-sm font-bold ${
                    customDomainStatus === "connected"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {customDomainStatus.replaceAll("_", " ")}
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
