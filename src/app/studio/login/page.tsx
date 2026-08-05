import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";

export const dynamic = "force-dynamic";

type LoginSearchParams = {
  error?: string;
};

const fieldClass =
  "mt-2 w-full rounded-[8px] border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

export default async function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <StudioHeader
        actions={[
          { href: "/", label: "TeamAlum" },
          { href: "/studio/start", label: "Start Site", tone: "primary" },
        ]}
        subtitle="Log back in to edit your TeamAlum site, update content, and manage launch steps."
        title="Studio Login"
      />

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          action="/studio/login/submit"
          className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm"
          method="post"
        >
          <h2 className="text-xl font-black">Welcome Back</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Use the email and password you created when you started the site.
          </p>

          {params.error ? (
            <div className="mt-5 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {params.error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5">
            <label className="text-sm font-bold text-slate-700">
              Email
              <input
                autoComplete="email"
                className={fieldClass}
                name="email"
                required
                type="email"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Password
              <input
                autoComplete="current-password"
                className={fieldClass}
                name="password"
                required
                type="password"
              />
            </label>
          </div>

          <button
            className="mt-6 w-full rounded-full bg-emerald-700 px-5 py-4 font-black uppercase text-white transition hover:bg-emerald-600"
            type="submit"
          >
            Log In
          </button>
        </form>

        <aside className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">New Here?</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Start a site once, then come back here whenever you need to update
            content, sponsors, events, campaigns, or launch settings.
          </p>
          <Link
            className="mt-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            href="/studio/start"
          >
            Start a Site
          </Link>
        </aside>
      </section>
    </main>
  );
}
