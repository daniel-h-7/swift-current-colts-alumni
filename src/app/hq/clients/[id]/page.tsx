import { notFound, redirect } from "next/navigation";
import { HqHeader } from "@/components/hq-header";
import { isHqAuthenticated } from "@/lib/hq-auth";
import {
  getClientFeatures,
  getClientIntegrations,
  getFeatureLabel,
  getIntegrationStatus,
} from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageParams = {
  id: string;
};

type PageSearchParams = {
  error?: string;
  saved?: string;
};

type ClientRow = {
  custom_domain?: string | null;
  id: string;
  name: string;
  plan_key?: string | null;
  primary_domain: string | null;
  published_at?: string | null;
  site_variant: string;
  status?: string | null;
  subdomain?: string | null;
  support_notes?: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  annual_membership_amount_cents: number;
  email_from_address: string;
  email_from_name: string;
  email_reply_to: string;
  email_sending_domain: string;
  join_body: string;
  join_headline: string;
  join_is_open: boolean;
  membership_year_label: string;
  renewal_deadline: string | null;
  updated_at: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getClientDetail(clientId: string) {
  const supabase = createServerSupabaseClient();
  const [
    clientResult,
    settingsResult,
    contactsResult,
    campaignsResult,
    features,
    integrations,
  ] = await Promise.all([
      supabase
        .from("clients")
        .select(
          "id, name, site_variant, primary_domain, created_at, updated_at, status, plan_key, subdomain, custom_domain, support_notes, published_at",
        )
        .eq("id", clientId)
        .maybeSingle(),
      supabase
        .from("crm_settings")
        .select(
          "annual_membership_amount_cents, email_from_address, email_from_name, email_reply_to, email_sending_domain, join_body, join_headline, join_is_open, membership_year_label, renewal_deadline, updated_at",
        )
        .eq("client_id", clientId)
        .eq("id", "default")
        .maybeSingle(),
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId),
      getClientFeatures(clientId),
      getClientIntegrations(clientId),
    ]);

  if (clientResult.error) {
    throw new Error(clientResult.error.message);
  }

  if (!clientResult.data) {
    notFound();
  }

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  return {
    campaignCount: campaignsResult.count ?? 0,
    client: clientResult.data as ClientRow,
    contactCount: contactsResult.count ?? 0,
    features,
    integrations,
    settings: settingsResult.data as SettingsRow | null,
  };
}

export default async function HqClientPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  if (!(await isHqAuthenticated())) {
    redirect("/hq/login");
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { client, settings, contactCount, campaignCount, features, integrations } =
    await getClientDetail(id);
  const membershipAmount = ((settings?.annual_membership_amount_cents ?? 10000) / 100).toFixed(2);
  const stripeStatus = getIntegrationStatus(integrations, "stripe_connect");
  const customDomainStatus = getIntegrationStatus(integrations, "custom_domain");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <HqHeader
        actions={[
          { href: "/hq", label: "Clients" },
          { href: "/hq/logout", label: "Log Out", tone: "danger" },
        ]}
        subtitle={`${client.id} in the shared Supabase database.`}
        title={client.name}
      />

      <section className="mx-auto max-w-7xl px-6 py-8">
        {query.saved === "1" ? (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            Client settings saved.
          </div>
        ) : null}

        {query.error ? (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {query.error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Contacts
            </p>
            <p className="mt-2 text-3xl font-black">{contactCount}</p>
          </div>
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Campaigns
            </p>
            <p className="mt-2 text-3xl font-black">{campaignCount}</p>
          </div>
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Plan
            </p>
            <p className="mt-2 text-sm font-black leading-6">
              {client.plan_key ?? "starter"}
            </p>
          </div>
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Status
            </p>
            <p className="mt-2 text-sm font-black leading-6">
              {client.status ?? "active"}
            </p>
          </div>
        </div>

        <form
          action={`/hq/clients/${encodeURIComponent(client.id)}/save`}
          className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]"
          method="post"
        >
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Client Metadata</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Client ID
                  <input
                    className="mt-2 w-full border border-slate-300 bg-slate-100 px-4 py-3 font-mono text-slate-500"
                    disabled
                    value={client.id}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Site Variant
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="site_variant"
                    required
                    defaultValue={client.site_variant}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Client Name
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="name"
                    required
                    defaultValue={client.name}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Primary Domain
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="primary_domain"
                    placeholder="club.teamalum.com"
                    defaultValue={client.primary_domain ?? ""}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Subdomain
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="subdomain"
                    placeholder="club"
                    defaultValue={client.subdomain ?? ""}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Custom Domain
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="custom_domain"
                    placeholder="clubfootball.com"
                    defaultValue={client.custom_domain ?? ""}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Plan
                  <select
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="plan_key"
                    defaultValue={client.plan_key ?? "starter"}
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Client Status
                  <select
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="status"
                    defaultValue={client.status ?? "active"}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Support Notes
                  <textarea
                    className="mt-2 min-h-24 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="support_notes"
                    defaultValue={client.support_notes ?? ""}
                  />
                </label>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Membership Settings</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Annual Membership Amount
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    min="0"
                    name="annual_membership_amount"
                    step="0.01"
                    type="number"
                    defaultValue={membershipAmount}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Renewal Deadline
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="renewal_deadline"
                    type="date"
                    defaultValue={settings?.renewal_deadline ?? ""}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Membership Year Label
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="membership_year_label"
                    required
                    defaultValue={
                      settings?.membership_year_label ??
                      "Annual Football Alumni and Booster Club"
                    }
                  />
                </label>
                <label className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 md:col-span-2">
                  <input
                    className="h-5 w-5 accent-blue-700"
                    name="join_is_open"
                    type="checkbox"
                    defaultChecked={settings?.join_is_open ?? true}
                  />
                  Join page is open
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Join Headline
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="join_headline"
                    required
                    defaultValue={settings?.join_headline ?? "Help build the legacy."}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Join Body
                  <textarea
                    className="mt-2 min-h-28 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="join_body"
                    required
                    defaultValue={
                      settings?.join_body ??
                      "Your gift today helps ensure student-athletes have the necessary tools to succeed on and off the football field."
                    }
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Platform Status</h2>
              <div className="mt-5 grid gap-3">
                <div className="border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Stripe Connect
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {stripeStatus.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Custom Domain
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {customDomainStatus.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Published
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-800">
                    {formatDate(client.published_at ?? null)}
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Feature Access</h2>
              <div className="mt-5 space-y-3">
                {features.map((feature) => (
                  <label
                    className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                    key={feature.feature_key}
                  >
                    <span>{getFeatureLabel(feature.feature_key)}</span>
                    <input
                      className="h-5 w-5 accent-blue-700"
                      defaultChecked={feature.is_enabled}
                      name={`feature:${feature.feature_key}`}
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Email Settings</h2>
              <div className="mt-5 space-y-5">
                <label className="block text-sm font-bold text-slate-700">
                  From Name
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="email_from_name"
                    required
                    defaultValue={settings?.email_from_name ?? "TeamAlum"}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  From Address
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="email_from_address"
                    required
                    type="email"
                    defaultValue={settings?.email_from_address ?? "onboarding@resend.dev"}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Reply-To
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="email_reply_to"
                    type="email"
                    defaultValue={settings?.email_reply_to ?? ""}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Sending Domain
                  <input
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                    name="email_sending_domain"
                    placeholder="mg.example.com"
                    defaultValue={settings?.email_sending_domain ?? ""}
                  />
                </label>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Save Changes</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Updates are written to the shared client and CRM settings
                tables for this tenant.
              </p>
              <button
                className="mt-5 w-full border border-blue-700 bg-blue-700 px-5 py-4 font-black uppercase tracking-[0.2em] text-white transition hover:bg-blue-600"
                type="submit"
              >
                Save Client
              </button>
            </section>
          </aside>
        </form>
      </section>
    </main>
  );
}
