import { redirect } from "next/navigation";
import { logContactActivity } from "@/lib/contact-activity";
import { getMembershipSettings } from "@/lib/membership-settings";
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

  if (!contactId) {
    redirect("/join");
  }

  const settings = await getMembershipSettings();
  const now = new Date().toISOString();
  const paidThrough = getPaidThroughDate();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      annual_dues_amount_cents: settings.annual_membership_amount_cents,
      last_payment_at: now.slice(0, 10),
      membership_status: "Active Member",
      paid_through: paidThrough,
      stripe_checkout_session_id: "mock_checkout_session",
    })
    .eq("id", contactId);

  if (!error) {
    try {
      await logContactActivity({
        body: `Mock payment completed. Paid through ${paidThrough}.`,
        contactId,
        metadata: {
          amount_cents: settings.annual_membership_amount_cents,
          mode: "mock",
          paid_through: paidThrough,
        },
        title: "Membership payment completed",
        type: "membership_payment_completed",
      });
    } catch {
      // Activity logging should not block the test payment flow.
    }
  }

  redirect(`/membership/success?contact_id=${contactId}`);
}
