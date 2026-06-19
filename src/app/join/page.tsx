import Image from "next/image";
import Link from "next/link";
import { JoinForm } from "@/components/join-form";
import {
  formatMembershipAmount,
  getMembershipSettings,
} from "@/lib/membership-settings";
import { getStripeMode, isStripeConfigured } from "@/lib/stripe";

export default async function JoinPage() {
  const settings = await getMembershipSettings();
  const checkoutMode = isStripeConfigured() ? getStripeMode() : "mock";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-screen overflow-hidden px-6 py-8">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover opacity-35"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/85 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.18),transparent_42%)]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col">
          <nav className="flex items-center justify-between py-2">
            <Link href="/" className="group">
              <p className="text-xs uppercase tracking-[4px] text-red-500">
                Swift Current
              </p>
              <p className="mt-1 text-xl font-black text-white group-hover:text-blue-400">
                Colts Alumni
              </p>
            </Link>

            <Link
              href="/admin"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold uppercase tracking-widest text-gray-200 hover:border-blue-500 hover:text-white"
            >
              Admin
            </Link>
          </nav>

          <div className="grid flex-1 gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[6px] text-red-500">
                {settings.membership_year_label}
              </p>
              <h1 className="mt-4 text-5xl font-black leading-none md:text-7xl">
                {settings.join_headline}
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                {settings.join_body}
              </p>
              <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
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
                      ? "Stripe sandbox checkout is connected for demos and test payments."
                      : "Secure Stripe checkout is connected for annual memberships."}
                </p>
                {!settings.join_is_open ? (
                  <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-sm font-bold text-red-200">
                    Membership signups are currently closed.
                  </p>
                ) : null}
              </div>
              <div className="mt-8 h-1 w-40 rounded-full bg-gradient-to-r from-blue-600 via-white to-red-600" />
            </div>

            <JoinForm isOpen={settings.join_is_open} />
          </div>
        </div>
      </section>
    </main>
  );
}
