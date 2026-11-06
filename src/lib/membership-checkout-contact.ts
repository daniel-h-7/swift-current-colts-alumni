import "server-only";
import type { ContactInsert } from "@/lib/contact-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Verify the payment columns before issuing a Stripe checkout URL. A missing
// migration must stop checkout before the supporter can pay.
export async function prepareMembershipContact(clientId: string, contact: ContactInsert, amountCents: number) {
  const supabase = createServerSupabaseClient();
  const email = contact.email.trim().toLowerCase();
  const { data: existing, error: lookupError } = await supabase.from("contacts")
    .select("id, membership_status, annual_dues_amount_cents, stripe_account_id, stripe_customer_id, stripe_checkout_session_id")
    .eq("client_id", clientId).eq("email", email).maybeSingle();
  if (lookupError) throw new Error("Membership signup is temporarily unavailable. The team needs to check its payment database setup.");

  const active = existing?.membership_status === "Active Member";
  const { data, error } = await supabase.from("contacts").upsert({
    ...contact,
    email,
    client_id: clientId,
    membership_status: active ? "Active Member" : "Pending Payment",
    annual_dues_amount_cents: active ? existing.annual_dues_amount_cents : amountCents,
  }, { onConflict: "client_id,email" }).select("id").single();
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function recordMembershipCheckout(clientId: string, contactId: string, session: {id: string; stripeAccountId?: string}) {
  const { error } = await createServerSupabaseClient().from("contacts").update({
    stripe_account_id: session.stripeAccountId ?? null,
    stripe_checkout_session_id: session.id,
  }).eq("client_id", clientId).eq("id", contactId);
  if (error) throw new Error("Unable to save the checkout link. No payment has been taken through this link; please contact your team.");
}
