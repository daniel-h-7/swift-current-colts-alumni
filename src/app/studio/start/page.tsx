import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";

export const dynamic = "force-dynamic";

type StartSearchParams = {
  error?: string;
};

const fieldClass =
  "mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

export default async function StudioStartPage({
  searchParams,
}: {
  searchParams: Promise<StartSearchParams>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <StudioHeader
        actions={[
          { href: "/", label: "TeamAlum" },
          { href: "/studio/login", label: "Log In" },
        ]}
        subtitle="Create the first version of a team site, then come back any time to keep it fresh."
        title="Start a TeamAlum Site"
      />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          action="/studio/create-site"
          className="border border-slate-200 bg-white p-6 shadow-sm"
          method="post"
        >
          <h2 className="text-xl font-black">Organization</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            This creates your site workspace and your owner login in the shared
            TeamAlum platform.
          </p>

          {params.error ? (
            <div className="mt-5 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {params.error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              Program Name
              <input
                className={fieldClass}
                name="name"
                placeholder="Swift Current Colts Football"
                required
              />
            </label>

            <label className="text-sm font-bold text-slate-700">
              Site URL
              <div className="mt-2 flex border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
                <input
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-slate-950 outline-none"
                  name="subdomain"
                  pattern="[a-z0-9][a-z0-9-]*"
                  placeholder="colts"
                  required
                />
                <span className="border-l border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-500">
                  .teamalum.com
                </span>
              </div>
            </label>

            <label className="text-sm font-bold text-slate-700">
              Team Type
              <select className={fieldClass} name="template" defaultValue="football">
                <option value="football">Football Alumni + Boosters</option>
                <option value="demo">General Demo</option>
              </select>
            </label>

            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              Membership Year Label
              <input
                className={fieldClass}
                name="membership_year_label"
                placeholder="2026 Colts Football Alumni & Booster Club"
              />
            </label>

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
              Owner Email
              <input
                className={fieldClass}
                name="admin_email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Owner Password
              <input
                autoComplete="new-password"
                className={fieldClass}
                minLength={8}
                name="password"
                required
                type="password"
              />
            </label>
          </div>

          <button
            className="mt-6 w-full border border-emerald-700 bg-emerald-700 px-5 py-4 font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-600"
            type="submit"
          >
            Create Site
          </button>
        </form>

        <aside className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">What Happens Next</h2>
            <div className="mt-5 space-y-3">
            {[
              "Your site workspace is created",
              "Your owner login is connected",
              "Default membership settings are seeded",
              "Core features are turned on",
              "You land in Studio to continue setup",
              ].map((item, index) => (
                <div
                  className="flex gap-3 border border-slate-200 bg-slate-50 p-4"
                  key={item}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm font-bold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Simple Pricing</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              TeamAlum is planned at $30/month, billed annually at $360. If the
              site does not raise enough to cover the fee, the site is on us.
            </p>
            <Link
              className="mt-5 inline-flex border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              href="/studio/login"
            >
              Log In Later
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
