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

type LaunchChecklistItem = {
  href?: string;
  isComplete: boolean;
  label: string;
  note: string;
};

export async function StudioDashboard({
  client,
  errorMessage,
  isCreated = false,
  isReviewSubmitted = false,
}: {
  client: PlatformClient;
  errorMessage?: string;
  isCreated?: boolean;
  isReviewSubmitted?: boolean;
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
  const previewHref = `/preview/${encodeURIComponent(client.id)}`;
  const enabledFeatures = features.filter((feature) => feature.is_enabled);
  const hasHomepageContent = Boolean(
    siteContent.brand.siteTitle &&
      siteContent.brand.heroTitle &&
      siteContent.brand.heroBody,
  );
  const hasVisualIdentity = Boolean(
    siteContent.brand.logoUrl || siteContent.brand.heroImageUrl,
  );
  const hasPublicAddress = Boolean(
    client.subdomain || client.custom_domain || client.primary_domain,
  );
  const isReviewRequested = Boolean(client.launch_review_requested_at);
  const isLaunchApproved = Boolean(client.launch_approved_at);
  const checklist: LaunchChecklistItem[] = [
    {
      href: `/studio/${encodeURIComponent(client.id)}/content`,
      isComplete: hasHomepageContent,
      label: "Homepage copy",
      note: "Site title, hero headline, and intro copy are filled in.",
    },
    {
      href: `/studio/${encodeURIComponent(client.id)}/content`,
      isComplete: hasVisualIdentity,
      label: "Logo and imagery",
      note: "Logo or hero image is ready for review.",
    },
    {
      isComplete: enabledFeatures.length > 0,
      label: "Feature selection",
      note: "At least one public site feature is enabled.",
    },
    {
      href: `/studio/${encodeURIComponent(client.id)}/payments`,
      isComplete: stripeStatus === "connected",
      label: "Client Stripe",
      note: "Membership payments are connected to the client Stripe account.",
    },
    {
      isComplete: hasPublicAddress,
      label: "Public address",
      note: "A TeamAlum subdomain or custom domain is assigned.",
    },
    {
      href: previewHref,
      isComplete: true,
      label: "Preview available",
      note: "Review the parked site before submitting.",
    },
  ];
  const completedChecklistItems = checklist.filter((item) => item.isComplete)
    .length;
  const completedSetup =
    3 + (stripeStatus === "connected" ? 1 : 0) +
    (customDomainStatus === "connected" ? 1 : 0);

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
          {isReviewSubmitted ? (
            <div className="border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700">
              Your site has been submitted to TeamAlum for launch review.
            </div>
          ) : null}
          {errorMessage ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
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
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                  form="feature-settings-form"
                  name="intent"
                  type="submit"
                  value="save"
                >
                  Save Settings
                </button>
                <Link
                  className="inline-flex border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                  href={previewHref}
                >
                  Preview Site
                </Link>
              </div>
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
            <div>
              <div>
                <h2 className="text-lg font-black">Homepage Content</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Current content blocks connected to the public template.
                </p>
              </div>
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
            <h2 className="text-lg font-black">Launch Checklist</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {completedChecklistItems} of {checklist.length} ready
            </p>
            <div className="mt-5 space-y-3">
              {checklist.map((item) => {
                const content = (
                  <>
                    <span className="text-sm font-black text-slate-800">
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-black uppercase tracking-[0.16em] ${
                        item.isComplete ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {item.isComplete ? "Ready" : "Needed"}
                    </span>
                  </>
                );

                return (
                  <div
                    className="border border-slate-200 bg-slate-50 p-4"
                    key={item.label}
                  >
                    {item.href ? (
                      <Link
                        className="flex items-center justify-between gap-3"
                        href={item.href}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        {content}
                      </div>
                    )}
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                      {item.note}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Review Status
              </p>
              <p className="mt-2 text-sm font-black text-slate-800">
                {isLaunchApproved
                  ? "Approved for launch"
                  : isReviewRequested
                    ? "Submitted to TeamAlum"
                    : "Not submitted yet"}
              </p>
            </div>

            <form
              action={`/studio/${encodeURIComponent(client.id)}/submit-review`}
              className="mt-5"
              method="post"
            >
              <button
                className="w-full border border-blue-700 bg-blue-700 px-5 py-4 font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-600"
                disabled={isLaunchApproved}
                type="submit"
              >
                {isReviewRequested ? "Resubmit For Review" : "Submit For Review"}
              </button>
            </form>
          </section>

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
                  Client Stripe
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
                <Link
                  className="mt-4 inline-flex border border-emerald-700 bg-emerald-700 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600"
                  href={`/studio/${encodeURIComponent(client.id)}/payments`}
                >
                  Manage Payments
                </Link>
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
