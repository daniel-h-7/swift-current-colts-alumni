import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  isAdminAuthenticated,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

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

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/85 to-black" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            Colts CRM
          </p>
          <h1 className="mt-3 text-4xl font-black">Admin Login</h1>
          <p className="mt-4 text-gray-400">
            Enter the club admin password to view contact records.
          </p>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              ADMIN_PASSWORD is not configured yet.
            </div>
          ) : null}

          {hasError ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              That password did not match.
            </div>
          ) : null}

          <form action={login} className="mt-6">
            <label className="text-sm font-bold text-gray-200">
              Password
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                name="password"
                required
                type="password"
              />
            </label>

            <button
              className="mt-6 w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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
