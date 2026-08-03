import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createHqSession,
  isHqAuthenticated,
  isHqPasswordConfigured,
  verifyHqPassword,
} from "@/lib/hq-auth";

type LoginSearchParams = {
  error?: string;
};

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");

  if (!verifyHqPassword(password)) {
    redirect("/hq/login?error=1");
  }

  await createHqSession();
  redirect("/hq");
}

export default async function HqLoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  if (await isHqAuthenticated()) {
    redirect("/hq");
  }

  const params = await searchParams;
  const hasError = params.error === "1";
  const isConfigured = isHqPasswordConfigured();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
            TeamAlum HQ
          </p>
          <h1 className="mt-3 text-4xl font-black">Admin Login</h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
            Manage every client in the shared TeamAlum database.
          </p>

          {!isConfigured ? (
            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
              HQ access is not configured yet. Add TEAMALUM_HQ_PASSWORD or
              ADMIN_PASSWORD in your environment variables.
            </div>
          ) : null}

          {hasError ? (
            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              That password did not match.
            </div>
          ) : null}

          <form action={login} className="mt-6">
            <label className="text-sm font-bold text-slate-700">
              Password
              <input
                className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                name="password"
                required
                type="password"
              />
            </label>

            <button
              className="mt-6 w-full border border-blue-700 bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isConfigured}
              type="submit"
            >
              Open HQ
            </button>
          </form>

          <Link
            className="mt-6 inline-flex text-sm font-bold text-slate-500 hover:text-slate-950"
            href="/"
          >
            Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
