import { buildLaunchReadiness } from "@/lib/launch-readiness";
import { getStripeMode } from "@/lib/stripe";
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

export async function StudioDashboard({
  client,
  errorMessage,
  isCreated = false,
  isHqEditing = false,
  isReviewSubmitted = false,
}: {
  client: PlatformClient;
  errorMessage?: string;
  isCreated?: boolean;
  isHqEditing?: boolean;
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
  const previewHref = `/preview/${encodeURIComponent(client.id)}`;
  const liveUrl = `https://${client.subdomain || client.id}.teamalum.com`;
  const isReviewRequested = Boolean(client.launch_review_requested_at);
  const isLaunchApproved = Boolean(client.launch_approved_at);
  const readiness = buildLaunchReadiness({ client, features, content: siteContent, stripe: integrations.find(i=>i.integration_key==="stripe_connect"), mode:getStripeMode(), rootDomain:process.env.TEAMALUM_ROOT_DOMAIN??"teamalum.com" });
  const checklist = readiness.items;
  const completedChecklistItems = readiness.completed;
  const completedSetup = readiness.completed;
  const setupItems = checklist.map(item=>item.label);

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <StudioHeader
        actions={[
          ...(isHqEditing ? [{ href: `/hq/clients/${client.id}`, label: "Back to HQ" }] : []),
          { href: `/studio/${client.id}/hub`, label: "Team Hub" },
          { href: `/studio/${client.id}`, label: "Site Setup", tone: "primary" },
          { href: "/studio/start", label: "Start Site" },
          { href: isHqEditing ? "/hq/logout" : "/studio/logout", label: "Log Out" },
        ]}
        subtitle="The client-facing workspace for building and managing a TeamAlum site."
        title={`${client.name} Builder Dashboard`}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {isCreated ? (
            <div className="border border-[#dfcc9a] bg-[#faf7ef] p-4 text-sm font-bold text-[#785d25]">
              Site workspace created. Continue setup below.
            </div>
          ) : null}
          {isReviewSubmitted ? (
            <div className="border border-[#dfcc9a] bg-[#faf7ef] p-4 text-sm font-bold text-[#785d25]">
              Your site has been submitted to TeamAlum for launch review.
            </div>
          ) : null}
          {errorMessage ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}
          {isHqEditing ? (
            <div className="border border-[#dfcc9a] bg-[#faf7ef] p-4 text-sm font-bold text-[#785d25]">
              HQ admin editing this client site. Client access remains limited
              to assigned users.
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
                  {liveUrl}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex border border-[#dfcc9a] bg-[#faf7ef] px-4 py-3 text-sm font-black text-[#785d25] transition hover:border-[#d9bd72] hover:bg-[#f1e7ce]"
                  form="feature-settings-form"
                  name="intent"
                  type="submit"
                  value="save"
                >
                  Save Settings
                </button>
                <Link
                  className="inline-flex border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#c5a45b] hover:text-[#785d25]"
                  href={previewHref}
                >
                  Preview Site
                </Link>
                {isLaunchApproved ? (
                  <Link
                    className="inline-flex border border-[#785d25] bg-[#785d25] px-4 py-3 text-sm font-black text-white transition hover:bg-[#8b6f2f]"
                    href={liveUrl}
                  >
                    Live Site
                  </Link>
                ) : null}
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
            <h2 className="text-lg font-black">Site URLs</h2>
            <div className="mt-4 space-y-3">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Preview
                </p>
                <Link
                  className="mt-2 block break-all text-sm font-black text-[#785d25] hover:text-[#8b6f2f]"
                  href={previewHref}
                >
                  {previewHref}
                </Link>
              </div>
              <div
                className={`border p-4 ${
                  isLaunchApproved
                    ? "border-[#dfcc9a] bg-[#faf7ef]"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    isLaunchApproved ? "text-[#785d25]" : "text-amber-700"
                  }`}
                >
                  Live
                </p>
                <Link
                  className="mt-2 block break-all text-sm font-black text-slate-800 hover:text-[#785d25]"
                  href={liveUrl}
                >
                  {liveUrl}
                </Link>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  {isLaunchApproved
                    ? "Approved and ready to share."
                    : "Parked until TeamAlum approves launch."}
                </p>
              </div>
            </div>
          </section>

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
                        item.isComplete ? "text-[#785d25]" : "text-amber-700"
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

            <div className="mt-5 rounded-2xl border border-[#dfcc9a] bg-[#faf7ef] p-5">
              <p className="font-bold">{readiness.nextAction ? `Next: ${readiness.nextAction.label}` : "All launch checks are complete."}</p>
              <form action={`/studio/${encodeURIComponent(client.id)}/setup`} method="post" className="mt-4 space-y-3">
                <input type="hidden" name="intent" value="review" />
                {[["content","I reviewed the homepage copy"],["visual","I reviewed the logo and images"],["features","I confirmed the selected features"],["preview","I opened and reviewed the current preview"]].map(([key,label])=><label className="flex gap-3 text-sm" key={key}><input type="checkbox" name={key} className="accent-[#785d25]"/>{label}</label>)}
                <button type="submit" className="rounded-full bg-[#17130d] px-4 py-3 text-sm font-bold text-white">Confirm reviewed items</button>
              </form>
              <form action={`/studio/${encodeURIComponent(client.id)}/setup`} method="post" className="mt-4"><input type="hidden" name="intent" value="verify_domain"/><button type="submit" className="text-sm font-bold text-[#785d25] underline underline-offset-4">Verify public hosting</button></form>
            </div>

            <form
              action={`/studio/${encodeURIComponent(client.id)}/submit-review`}
              className="mt-5"
              method="post"
            >
              <button
                className="w-full border border-[#785d25] bg-[#785d25] px-5 py-4 font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#8b6f2f]"
                disabled={isLaunchApproved || !readiness.isReady}
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
            <div className="mt-4 h-2 bg-[#f5f1e8]">
              <div
                className="h-2 bg-[#8b6f2f]"
                style={{
                  width: `${Math.round((completedSetup / setupItems.length) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">Use the checklist above to review each remaining step.</p>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Payments</h2>
            <div className="mt-4 space-y-4">
              <div className="border border-[#dfcc9a] bg-[#faf7ef] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#785d25]">
                  TeamAlum Access
                </p>
                <p className="mt-2 text-xl font-black">$360 / year</p>
                <p className="mt-2 text-xs font-bold leading-5 text-[#624c22]">
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
                      ? "text-[#785d25]"
                      : "text-amber-700"
                  }`}
                >
                  {stripeStatus.replaceAll("_", " ")}
                </p>
                <Link
                  className="mt-4 inline-flex border border-[#785d25] bg-[#785d25] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#8b6f2f]"
                  href={`/studio/${encodeURIComponent(client.id)}/payments`}
                >
                  Manage Payments
                </Link>
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
