import Image from "next/image";
import { redirect } from "next/navigation";
import {
  createDemoSession,
  isDemoPasswordConfigured,
  verifyDemoPassword,
} from "@/lib/demo-auth";

type DemoSearchParams = {
  error?: string;
  next?: string;
};

function getSafeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value.startsWith("/demo")) {
    return "/";
  }

  return value;
}

async function unlockDemo(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(String(formData.get("next") ?? ""));

  if (!verifyDemoPassword(password)) {
    const params = new URLSearchParams({
      error: "1",
      next: nextPath,
    });

    redirect(`/demo?${params.toString()}`);
  }

  await createDemoSession();
  redirect(nextPath);
}

export default async function DemoAccessPage({
  searchParams,
}: {
  searchParams: Promise<DemoSearchParams>;
}) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const hasError = params.error === "1";
  const isConfigured = isDemoPasswordConfigured();

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

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            TeamAlum Demo
          </p>
          <h1 className="mt-3 text-4xl font-black">Demo Access</h1>
          <p className="mt-4 text-gray-400">
            Enter the demo password to preview the public site.
          </p>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              DEMO_PASSWORD is not configured yet.
            </div>
          ) : null}

          {hasError ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              That demo password did not match.
            </div>
          ) : null}

          <form action={unlockDemo} className="mt-6 text-left">
            <input name="next" type="hidden" value={nextPath} />
            <label className="text-sm font-bold text-gray-200">
              Demo password
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                name="password"
                required
                type="password"
              />
            </label>

            <button
              className="mt-6 w-full rounded-md bg-red-600 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isConfigured}
              type="submit"
            >
              Enter Demo
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
