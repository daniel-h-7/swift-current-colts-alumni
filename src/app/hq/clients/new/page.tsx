import { redirect } from "next/navigation";
import { HqHeader } from "@/components/hq-header";
import { isHqAuthenticated } from "@/lib/hq-auth";
import {
  defaultClientFeatures,
  getFeatureDescription,
  getFeatureLabel,
} from "@/lib/platform-data";

export const dynamic = "force-dynamic";

type NewClientSearchParams = {
  error?: string;
};

const fieldClass =
  "mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

export default async function NewHqClientPage({
  searchParams,
}: {
  searchParams: Promise<NewClientSearchParams>;
}) {
  if (!(await isHqAuthenticated())) {
    redirect("/hq/login");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <HqHeader
        actions={[
          { href: "/hq", label: "Clients" },
          { href: "/hq/logout", label: "Log Out", tone: "danger" },
        ]}
        subtitle="Create a new tenant in the shared TeamAlum database."
        title="New Client"
      />

      <section className="mx-auto max-w-5xl px-6 py-8">
        {params.error ? (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {params.error}
          </div>
        ) : null}

        <form
          action="/hq/clients/create"
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
          method="post"
        >
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Client Identity</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Client ID
                  <input
                    className={fieldClass}
                    name="id"
                    pattern="[a-z0-9][a-z0-9-]*"
                    placeholder="swift-current-colts"
                    required
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Site Variant
                  <input
                    className={fieldClass}
                    name="site_variant"
                    placeholder="colts"
                    required
                  />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Client Name
                  <input
                    className={fieldClass}
                    name="name"
                    placeholder="Swift Current Colts Football"
                    required
                  />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  TeamAlum Subdomain
                  <input
                    className={fieldClass}
                    name="subdomain"
                    placeholder="colts"
                  />
                  <span className="mt-2 block text-xs font-semibold text-slate-500">
                    This becomes client.teamalum.com after launch approval.
                  </span>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Plan
                  <select className={fieldClass} name="plan_key" defaultValue="starter">
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Status
                  <select className={fieldClass} name="status" defaultValue="trial">
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Membership Defaults</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Annual Membership Amount
                  <input
                    className={fieldClass}
                    defaultValue="100.00"
                    min="0"
                    name="annual_membership_amount"
                    step="0.01"
                    type="number"
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Renewal Deadline
                  <input className={fieldClass} name="renewal_deadline" type="date" />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Membership Year Label
                  <input
                    className={fieldClass}
                    defaultValue="Annual Football Alumni and Booster Club"
                    name="membership_year_label"
                    required
                  />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Join Headline
                  <input
                    className={fieldClass}
                    defaultValue="Help build the legacy."
                    name="join_headline"
                    required
                  />
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Join Body
                  <textarea
                    className={`${fieldClass} min-h-28`}
                    defaultValue="Your gift today helps ensure student-athletes have the necessary tools to succeed on and off the football field."
                    name="join_body"
                    required
                  />
                </label>
                <label className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 md:col-span-2">
                  <input
                    className="h-5 w-5 accent-blue-700"
                    defaultChecked
                    name="join_is_open"
                    type="checkbox"
                  />
                  Join page is open
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Feature Access</h2>
              <div className="mt-5 space-y-3">
                {defaultClientFeatures
                  .filter((feature) => feature.feature_key !== "custom_domain")
                  .map((feature) => (
                  <label
                    className="block border border-slate-200 bg-slate-50 p-4"
                    key={feature.feature_key}
                  >
                    <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-800">
                      {getFeatureLabel(feature.feature_key)}
                      <input
                        className="h-5 w-5 accent-blue-700"
                        defaultChecked={feature.is_enabled}
                        name={`feature:${feature.feature_key}`}
                        type="checkbox"
                      />
                    </span>
                    <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">
                      {getFeatureDescription(feature.feature_key)}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Create Client</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                This seeds the client, default CRM settings, and feature flags.
              </p>
              <button
                className="mt-5 w-full border border-blue-700 bg-blue-700 px-5 py-4 font-black uppercase tracking-[0.2em] text-white transition hover:bg-blue-600"
                type="submit"
              >
                Create Client
              </button>
            </section>
          </aside>
        </form>
      </section>
    </main>
  );
}
