import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  isAdminAuthenticated,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { getSiteBrand } from "@/lib/site-brand";

type LoginSearchParams = {
  error?: string;
};

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const hasError = params.error === "1";
  const isConfigured = isAdminPasswordConfigured();
  const brand = getSiteBrand();

  return (
    <main className={`min-h-screen bg-black text-white ${brand.isDemo ? "demo-public" : ""}`}>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/85 to-black" />
        <div className="absolute inset-0 premium-grid opacity-25" />

        <div className="relative z-10 w-full max-w-md border border-white/10 bg-zinc-950/92 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.44)]">
          <div className="mb-7 flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center border text-sm font-black text-white ${
                brand.isDemo
                  ? "border-white/40 bg-white/12"
                  : "border-red-500/45 bg-red-600"
              }`}
            >
              {brand.initials}
            </span>
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[4px] ${brand.isDemo ? "text-gray-300" : "text-red-400"}`}>
                {brand.logoEyebrow}
              </p>
              <p className="mt-1 font-black text-white">{brand.logoTitle}</p>
            </div>
          </div>
          <p className="program-kicker">
            {brand.isDemo ? "Northwest Yetis CRM" : "Colts CRM"}
          </p>
          <h1 className="mt-3 text-4xl font-black">Admin Login</h1>
          <p className="mt-4 text-gray-400">
            Enter the club admin password to view contact records.
          </p>

          {!isConfigured ? (
            <div className="mt-6 border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold leading-6 text-red-200">
              Admin access is not configured yet. Add ADMIN_PASSWORD in your
              environment variables, then redeploy or restart the dev server.
            </div>
          ) : null}

          {hasError ? (
            <div className="mt-6 border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              That password did not match.
            </div>
          ) : null}

          <form action={login} className="mt-6">
            <label className="text-sm font-bold text-gray-200">
              Password
              <input
                className="mt-2 w-full border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                name="password"
                required
                type="password"
              />
            </label>

            <button
              className="mt-6 w-full border border-blue-400/40 bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isConfigured}
              type="submit"
            >
              Open Dashboard
            </button>
          </form>

          <Link
            className="mt-6 inline-flex text-sm font-bold text-gray-400 hover:text-white"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
