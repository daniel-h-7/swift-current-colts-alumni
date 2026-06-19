import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCurrencyFromCents } from "@/lib/contact-format";
import { getMembershipSettings } from "@/lib/membership-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MockCheckoutSearchParams = {
  contact_id?: string;
  gift_cents?: string;
};

async function getContact(contactId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email")
    .eq("id", contactId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<MockCheckoutSearchParams>;
}) {
  const { contact_id: contactId, gift_cents: giftCentsValue } =
    await searchParams;
  const giftCents = Math.max(0, Number.parseInt(giftCentsValue ?? "0", 10) || 0);

  if (!contactId) {
    redirect("/join");
  }

  const [settings, contact] = await Promise.all([
    getMembershipSettings(),
    getContact(contactId),
  ]);

  if (!contact) {
    redirect("/join");
  }

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

        <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/90 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            Mock Checkout
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Complete annual membership
          </h1>
          <p className="mt-4 text-gray-400">
            This is a test checkout screen. It stands in for Stripe until the
            Stripe account and keys are connected.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
              Member
            </p>
            <p className="mt-2 text-xl font-black">
              {contact.first_name} {contact.last_name}
            </p>
            <p className="mt-1 text-sm font-bold text-blue-300">
              {contact.email}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
              Annual dues
            </p>
            <p className="mt-2 text-4xl font-black">
              {formatCurrencyFromCents(
                settings.annual_membership_amount_cents,
              )}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {settings.membership_year_label}
            </p>
          </div>

          {giftCents > 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Additional one-time gift
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatCurrencyFromCents(giftCents)}
              </p>
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-950/30 p-5">
            <p className="text-xs font-black uppercase tracking-[3px] text-blue-200">
              Total test payment
            </p>
            <p className="mt-2 text-4xl font-black">
              {formatCurrencyFromCents(
                settings.annual_membership_amount_cents + giftCents,
              )}
            </p>
          </div>

          <form
            action="/api/membership/mock-complete"
            className="mt-8"
            method="post"
          >
            <input name="contact_id" type="hidden" value={contact.id} />
            <input name="gift_cents" type="hidden" value={giftCents} />
            <button
              className="w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
              type="submit"
            >
              Mark Test Payment Complete
            </button>
          </form>

          <Link
            className="mt-6 inline-flex text-sm font-bold text-gray-400 hover:text-white"
            href="/join"
          >
            Back to join form
          </Link>
        </div>
      </section>
    </main>
  );
}
