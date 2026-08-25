import Link from "next/link";
import { getSiteBrand } from "@/lib/site-brand";

export function SiteNotLaunched({
  siteName,
}: {
  siteName?: string | null;
}) {
  const brand = getSiteBrand();
  const displayName = siteName || brand.programName;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
          TeamAlum site pending launch
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
          {displayName} is getting ready.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-300 md:text-lg">
          This site is being reviewed before going public. The program team can
          keep editing in Studio, and TeamAlum HQ will approve launch once
          content, payments, email, and launch settings are ready.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="border border-emerald-400 bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-emerald-300"
            href="/studio/login"
          >
            Studio Login
          </Link>
          <Link
            className="border border-white/15 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/10"
            href="/"
          >
            TeamAlum
          </Link>
        </div>
      </section>
    </main>
  );
}
