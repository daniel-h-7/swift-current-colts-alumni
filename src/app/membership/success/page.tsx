import Image from "next/image";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { SupportShareBar } from "@/components/support-share-bar";
import { getSiteBrand } from "@/lib/site-brand";

export default function MembershipSuccessPage() {
  const brand = getSiteBrand();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const shareUrl = siteUrl ? `${siteUrl}/join` : undefined;

  return (
    <main className={`min-h-screen bg-black text-white ${brand.isDemo ? "demo-public" : ""}`}>
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/85 to-black" />
        <div className="absolute inset-0 premium-grid opacity-25" />

        <PublicNav compact />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center justify-center px-6 pb-12">
          <div className="w-full max-w-2xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
            <p className="program-kicker">
              Success!
            </p>
            <h1 className="mt-3 text-4xl font-black">
              {brand.successHeading}
            </h1>
            <p className="mt-4 text-gray-400">
              {brand.successProgramLine}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                className="border border-blue-400/40 bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-600"
                href="/"
              >
                Home
              </Link>
              <Link
                className="border border-white/15 px-6 py-3 font-bold text-gray-200 hover:border-blue-500 hover:text-white"
                href="/membership/manage"
              >
                Manage Membership
              </Link>
            </div>

            <SupportShareBar
              shareText={
                brand.isDemo
                  ? "Take a look at this TeamAlum demo for alumni, booster, sponsor, and membership management."
                  : undefined
              }
              shareUrl={shareUrl}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
