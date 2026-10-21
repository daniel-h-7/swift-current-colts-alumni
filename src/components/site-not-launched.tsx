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
    <main className="min-h-screen bg-white text-[#171917]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#785d25]">
          TeamAlum site pending launch
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight md:text-6xl">
          {displayName} is getting ready.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#62675e] md:text-lg">
          This site is being reviewed before going public. The program team can
          keep editing in Studio, and TeamAlum HQ will approve launch once
          content, payments, email, and launch settings are ready.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="border border-[#171917] bg-[#171917] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#363b35]"
            href="/studio/login"
          >
            Studio Login
          </Link>
          <Link
            className="border-b border-[#c5a45b] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#785d25] transition hover:text-[#171917]"
            href="https://www.teamalum.com"
          >
            TeamAlum
          </Link>
        </div>
      </section>
    </main>
  );
}
