import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";

export const dynamic = "force-dynamic";

type LoginSearchParams = {
  error?: string;
  reset?: string;
};

const fieldClass =
  "mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#a18442] focus:ring-2 focus:ring-[#a18442]/25";

export default async function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-slate-950">
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
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_16px_50px_rgba(23,19,13,0.06)]"
          method="post"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#785d25]">Your program. Your people.</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Welcome back.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Use the email and password you created when you started the site.
          </p>

          {params.reset === "success" ? <p role="status" className="mt-5 rounded-2xl bg-[#f1e7ce] p-4 text-sm text-[#17130d]">Password updated. Log in with your new password.</p> : null}

          {params.error ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
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

          <Link className="mt-4 inline-block text-sm font-bold text-[#785d25] underline underline-offset-4 hover:text-black" href="/studio/forgot-password">Forgot password?</Link>

          <button
            className="mt-6 w-full rounded-full bg-[#17130d] px-5 py-4 font-black uppercase text-white transition hover:bg-[#362b19]"
            type="submit"
          >
            Log In
          </button>
        </form>

        <aside className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_16px_50px_rgba(23,19,13,0.06)]">
          <h2 className="text-lg font-black">New Here?</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Start a site once, then come back here whenever you need to update
            content, sponsors, events, campaigns, or launch settings.
          </p>
          <Link
            className="mt-5 inline-flex rounded-full border border-[#dfcc9a] bg-[#faf7ef] px-4 py-3 text-sm font-black text-[#785d25] transition hover:border-[#d9bd72] hover:bg-[#f1e7ce]"
            href="/studio/start"
          >
            Start a Site
          </Link>
        </aside>
      </section>
    </main>
  );
}
