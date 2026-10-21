import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createStandardConnectedAccount, retrieveConnectedAccount, stripePlatformMode } from "@/lib/stripe-connect";
import { saveVerifiedStripeConnection } from "@/lib/stripe-connection";

export async function createOrResumeStripeAccount(client: { id: string; name: string; primary_domain?: string | null }, owner: { authUserId: string; email: string }) {
  const supabase = createServerSupabaseClient();
  const mode = stripePlatformMode();
  const { data, error } = await supabase.rpc("teamalum_begin_stripe_setup", {
    p_client_id: client.id, p_owner_id: owner.authUserId, p_mode: mode,
    p_parameters: { clientId: client.id, email: owner.email, name: client.name, websiteUrl: client.primary_domain ? `https://${client.primary_domain}` : null },
  });
  const attempt = Array.isArray(data) ? data[0] : data;
  if (error || !attempt) throw new Error(error?.message || "Unable to reserve Stripe setup. Apply the setup reliability migration.");
  const account = attempt.account_id ? await retrieveConnectedAccount(attempt.account_id) : await createStandardConnectedAccount({ ...attempt.parameters, idempotencyKey: `teamalum-account-${attempt.attempt_id}` });
  const { error: saveError } = await supabase.from("stripe_setup_attempts").update({ account_id: account.id }).eq("client_id", client.id).eq("mode", mode);
  if (saveError) throw new Error("Stripe setup was reserved but could not be saved. Retry this same organization's setup; do not create another organization.");
  await saveVerifiedStripeConnection(client.id, account);
  return account.id;
}
