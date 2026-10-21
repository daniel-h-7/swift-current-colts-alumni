import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";
import { stripeSetupSteps, stripeSetupTroubleshooting } from "@/lib/stripe-setup-guide";

export const metadata = {
  title: "Connect Stripe | TeamAlum setup guide",
  description: "A practical guide to connecting your organization’s own Stripe account to TeamAlum.",
};

export default function StripeSetupGuidePage() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#17130d]">
      <StudioHeader title="Connect Stripe" subtitle="A step-by-step guide for your organization’s account owner." actions={[{ href: "/studio", label: "Open Studio" }, { href: "/studio/login", label: "Log In" }]} />
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#785d25]">TeamAlum field guide</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">Your program.<br /><span className="font-serif font-normal italic">Your payments.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#62563f]">Your organization owns its Stripe account and manages its bank details, payouts, and refunds through Stripe. TeamAlum connects your membership page to that account.</p>
          <nav aria-label="Guide sections" className="mt-7 flex flex-wrap gap-3 text-sm font-bold">
            <a className="rounded-full bg-[#17130d] px-5 py-3 text-white hover:bg-[#362b19]" href="#new-account">Set up payments</a>
            <a className="rounded-full border border-[#c5a45b] px-5 py-3 hover:bg-[#f1e7ce]" href="#existing-account">Already use Stripe?</a>
            <a className="rounded-full px-5 py-3 text-[#785d25] underline underline-offset-4" href="#questions">Common questions</a>
          </nav>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <section id="existing-account" className="scroll-mt-6 rounded-[2rem] border-l-4 border-[#c5a45b] bg-white p-7 md:p-9">
              <h2 className="text-2xl font-black">Already have a Stripe account?</h2>
              <p className="mt-3 leading-7 text-slate-600">Have TeamAlum verify the existing account before starting a new connection. Today’s setup creates a new account when no connection is saved. The same Stripe email can contain more than one account.</p>
              <p className="mt-3 font-semibold leading-7">Preserve the account used by existing memberships. Rebuilding your site’s content does not require a new Stripe account.</p>
            </section>
            <section id="new-account" className="mt-10 scroll-mt-6">
              <h2 className="text-3xl font-black tracking-tight">From setup to ready.</h2>
              <ol className="mt-6 space-y-4">
                {stripeSetupSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-4 rounded-3xl bg-white p-6 md:gap-6 md:p-8">
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1e7ce] text-sm font-black text-[#785d25]">{index + 1}</span>
                    <div><h3 className="text-lg font-black">{step.title}</h3><p className="mt-2 leading-7 text-slate-600">{step.body}</p></div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <aside className="rounded-[2rem] bg-[#17130d] p-7 text-[#f8f1df]">
            <h2 className="text-xl font-black text-[#d9bd72]">Before you begin</h2>
            <ul className="mt-5 list-disc space-y-4 pl-5 text-sm leading-6">
              <li>Your organization’s authorized representative should complete setup.</li>
              <li>Have the organization’s legal details, representative information, and payout bank details ready. Stripe’s exact requirements vary.</li>
              <li>Confirm the site name and annual membership amount in Studio.</li>
              <li>Use the same browser and TeamAlum hostname throughout setup.</li>
            </ul>
            <p className="mt-7 border-t border-[#c5a45b]/30 pt-5 text-sm leading-6 text-[#d9bd72]">You don’t need to send TeamAlum your bank details or your own Stripe secret API key.</p>
            <a className="mt-5 inline-flex rounded-full bg-[#c5a45b] px-5 py-3 text-sm font-bold text-[#17130d] hover:bg-[#d9bd72]" href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer">Open Stripe Dashboard ↗</a>
          </aside>
        </div>
        <section id="questions" className="mt-14 scroll-mt-6">
          <h2 className="text-3xl font-black tracking-tight">A little help along the way.</h2>
          <div className="mt-6 divide-y divide-[#dfcc9a]">
            {stripeSetupTroubleshooting.map(item => (
              <details className="py-5" key={item.question}><summary className="cursor-pointer text-lg font-bold marker:text-[#785d25]">{item.question}</summary><p className="mt-3 max-w-3xl leading-7 text-slate-600">{item.answer}</p></details>
            ))}
          </div>
        </section>
        <p className="mt-10 text-sm leading-6 text-[#62563f]">Reference: <a className="underline underline-offset-4" href="https://docs.stripe.com/connect/standard-accounts">Stripe account onboarding</a>. Requirements and screens can change. This guide describes TeamAlum’s current setup.</p>
        <Link className="mt-7 inline-block text-sm font-bold text-[#785d25] underline underline-offset-4" href="/studio">Back to Studio</Link>
      </section>
    </main>
  );
}
