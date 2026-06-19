import { redirect } from "next/navigation";
import { logContactActivity } from "@/lib/contact-activity";
import { formatCurrencyFromCents } from "@/lib/contact-format";
import { getMembershipSettings } from "@/lib/membership-settings";
import { runNewSignupAutomation } from "@/lib/new-signup-automation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getPaidThroughDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const contactId = String(formData.get("contact_id") ?? "");
  const giftCents = Math.max(
    0,
    Number.parseInt(String(formData.get("gift_cents") ?? "0"), 10) || 0,
  );

  if (!contactId) {
    redirect("/join");
  }

  const settings = await getMembershipSettings();
  const now = new Date().toISOString();
  const paidThrough = getPaidThroughDate();
  const supabase = createServerSupabaseClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("gift_donation_amount_cents")
    .eq("id", contactId)
    .maybeSingle();
  const { error } = await supabase
    .from("contacts")
    .update({
      annual_dues_amount_cents: settings.annual_membership_amount_cents,
      gift_donation_amount_cents:
        Number(contact?.gift_donation_amount_cents ?? 0) + giftCents,
      last_payment_at: now.slice(0, 10),
      membership_status: "Active Member",
      paid_through: paidThrough,
      stripe_checkout_session_id: "mock_checkout_session",
    })
    .eq("id", contactId);

  if (!error) {
    try {
      await logContactActivity({
        body:
          giftCents > 0
            ? `Mock membership completed. One-time gift ${formatCurrencyFromCents(giftCents)}. Paid through ${paidThrough}.`
            : `Mock membership completed. Paid through ${paidThrough}.`,
        contactId,
        metadata: {
          amount_cents: settings.annual_membership_amount_cents,
          additional_gift_amount_cents: giftCents,
          total_amount_cents:
            settings.annual_membership_amount_cents + giftCents,
          mode: "mock",
          paid_through: paidThrough,
        },
        title: "Membership payment completed",
        type: "membership_payment_completed",
      });
    } catch {
      // Activity logging should not block the test payment flow.
    }

    if (giftCents > 0) {
      await logContactActivity({
        body: `One-time gift ${formatCurrencyFromCents(giftCents)}.`,
        contactId,
        metadata: {
          amount_cents: giftCents,
          mode: "mock",
        },
        title: "One-time gift received",
        type: "gift_donation_received",
      }).catch(() => undefined);
    }

    await runNewSignupAutomation({
      contactId,
      source: "mock",
    }).catch(() => undefined);
  }

  redirect(`/membership/success?contact_id=${contactId}`);
}
