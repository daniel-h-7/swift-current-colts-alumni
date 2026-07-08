import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JoinForm } from "@/components/join-form";
import { PublicNav } from "@/components/public-nav";
import { getSiteBrand } from "@/lib/site-brand";
import {
  formatMembershipAmount,
  getMembershipSettings,
} from "@/lib/membership-settings";
import { getStripeMode, isStripeConfigured } from "@/lib/stripe";

const brand = getSiteBrand();
const shareDescription = brand.isDemo
  ? "Preview a polished TeamAlum supporter signup flow for alumni, boosters, sponsors, and football programs."
  : "I invite you to join me in supporting Swift Current Colts Football. As an alumni or booster, our gift can make a lasting impact on our young student-athletes!";

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
  const brand = getSiteBrand();
  const settings = await getMembershipSettings();
  const checkoutMode = isStripeConfigured() ? getStripeMode() : "mock";

  return (
    <main className={`min-h-screen bg-black text-white ${brand.isDemo ? "demo-public" : ""}`}>
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover object-center opacity-50 grayscale"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/65 via-black/75 to-black" />
        <div className="absolute inset-0 premium-grid opacity-25" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(37,99,235,0.22)_0%,transparent_34%,rgba(220,38,38,0.18)_72%,transparent_100%)]" />

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
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {checkoutMode === "mock"
                    ? "This demo captures the CRM record and uses a mock checkout until Stripe keys are configured."
                    : checkoutMode === "sandbox"
                      ? "Stripe sandbox checkout is connected for annual membership demos."
                      : "Secure Stripe checkout is connected for annual memberships."}
                </p>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Renews each year on the subscription date until opted out.
                </p>
                <Link
                  className="mt-3 inline-flex text-xs font-bold text-blue-300 hover:text-blue-200"
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
              <div className="mt-8 h-px w-56 bg-gradient-to-r from-blue-600 via-white to-red-600" />
            </div>

            <JoinForm
              headline={brand.joinHeadline}
              isOpen={settings.join_is_open}
              programName={brand.isDemo ? "the program" : "the Colts"}
              subtext={brand.joinSubtext}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
