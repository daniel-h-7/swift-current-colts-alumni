import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JoinForm } from "@/components/join-form";
import { PublicNav } from "@/components/public-nav";
import { SiteNotLaunched } from "@/components/site-not-launched";
import { getCurrentClientLaunchState } from "@/lib/launch-approval";
import { getSiteBrand } from "@/lib/site-brand";
import {
  formatMembershipAmount,
  getMembershipSettings,
} from "@/lib/membership-settings";

const brand = getSiteBrand();
const shareDescription = brand.shareDescription;

export const metadata: Metadata = {
  description: shareDescription,
  openGraph: {
    description: shareDescription,
    images: [
      {
        alt: `Support ${brand.programName}`,
        height: 630,
        url: "/join/opengraph-image",
        width: 1200,
      },
    ],
    title: `Support ${brand.programName}`,
    type: "website",
  },
  title: `Support ${brand.programName}`,
  twitter: {
    card: "summary_large_image",
    description: shareDescription,
    images: ["/join/opengraph-image"],
    title: `Support ${brand.programName}`,
  },
};

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const launchState = await getCurrentClientLaunchState();

  if (!launchState.isApproved) {
    return <SiteNotLaunched siteName={launchState.client?.name} />;
  }

  const brand = getSiteBrand();
  const settings = await getMembershipSettings();

  return (
    <main className={`min-h-screen bg-black text-white ${brand.themeClass}`}>
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src={brand.heroImage}
          alt="Football stadium under Friday night lights"
          fill
          priority
          className={`object-cover object-center ${
            brand.variant === "rmrfootball"
              ? "opacity-35 saturate-110"
              : brand.variant === "bfbadgers"
                ? "scale-110 opacity-42 saturate-110"
              : "opacity-50 grayscale"
          }`}
        />

        <div className={`absolute inset-0 ${brand.variant === "rmrfootball" ? "bg-gradient-to-b from-black/78 via-black/82 to-black" : brand.variant === "bfbadgers" ? "bg-gradient-to-b from-[#041f3d]/72 via-black/80 to-black" : "bg-gradient-to-b from-blue-950/65 via-black/75 to-black"}`} />
        <div className="absolute inset-0 premium-grid opacity-25" />
        <div className={`absolute inset-0 ${brand.variant === "rmrfootball" ? "bg-[linear-gradient(115deg,rgba(206,183,76,0.12)_0%,transparent_34%,rgba(206,183,76,0.08)_72%,transparent_100%)]" : brand.variant === "bfbadgers" ? "bg-[linear-gradient(115deg,rgba(59,130,246,0.18)_0%,transparent_34%,rgba(255,255,255,0.08)_72%,transparent_100%)]" : "bg-[linear-gradient(115deg,rgba(37,99,235,0.22)_0%,transparent_34%,rgba(220,38,38,0.18)_72%,transparent_100%)]"}`} />

        <PublicNav compact />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-12">
          <div className="grid flex-1 gap-10 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="border-l border-white/10 pl-6 lg:pt-8">
              <p className="program-kicker">
                {settings.membership_year_label}
              </p>
              <div className="mt-7 border border-white/10 bg-zinc-950/80 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Annual Membership
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {formatMembershipAmount(settings)}
                </p>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Renews each year on the subscription date until opted out.
                </p>
                <Link
                  className={`mt-3 inline-flex text-xs font-bold ${brand.variant === "rmrfootball" ? "text-[#CEB74C] hover:text-[#e5d36b]" : brand.variant === "bfbadgers" ? "text-blue-200 hover:text-white" : "text-blue-300 hover:text-blue-200"}`}
                  href="/membership/manage"
                >
                  Manage or cancel an existing membership
                </Link>
                {!settings.join_is_open ? (
                  <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-sm font-bold text-red-200">
                    Membership signups are currently closed.
                  </p>
                ) : null}
              </div>
              <div className={`mt-8 h-px w-56 ${brand.variant === "rmrfootball" ? "bg-gradient-to-r from-transparent via-[#CEB74C] to-transparent" : brand.variant === "bfbadgers" ? "bg-gradient-to-r from-transparent via-blue-200 to-transparent" : "bg-gradient-to-r from-blue-600 via-white to-red-600"}`} />
            </div>

            <JoinForm
              headline={brand.joinHeadline}
              isOpen={settings.join_is_open}
              programName={brand.joinProgramName}
              subtext={brand.joinSubtext}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
