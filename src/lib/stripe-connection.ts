import "server-only";
import type { ClientIntegration } from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeAccountStatus, retrieveConnectedAccount, stripePlatformMode, type StripeConnectedAccount } from "@/lib/stripe-connect";

export function stripeVerificationMetadata(clientId: string, account: StripeConnectedAccount, mode: string) {
  return {
    verified_client_id: clientId, verified_account_id: account.id, verification_mode: mode,
    last_checked_at: new Date().toISOString(), charges_enabled: account.charges_enabled === true,
    payouts_enabled: account.payouts_enabled === true, details_submitted: account.details_submitted === true,
    disabled_reason: account.requirements?.disabled_reason ?? null,
    currently_due: account.requirements?.currently_due ?? [], past_due: account.requirements?.past_due ?? [],
  };
}

export function isVerifiedStripeMapping(clientId: string, integration: ClientIntegration | null | undefined, mode: string) {
  const metadata = integration?.metadata;
  return Boolean(integration?.status === "connected" && integration.external_account_id?.startsWith("acct_") &&
    metadata?.verified_client_id === clientId && metadata.verified_account_id === integration.external_account_id &&
    metadata.verification_mode === mode && metadata.charges_enabled === true && metadata.payouts_enabled === true && metadata.details_submitted === true && !metadata.disabled_reason);
}

export async function saveVerifiedStripeConnection(clientId: string, account: StripeConnectedAccount) {
  if (account.metadata?.teamalum_client_id && account.metadata.teamalum_client_id !== clientId) throw new Error("This Stripe account belongs to a different TeamAlum client.");
  const metadata = stripeVerificationMetadata(clientId, account, stripePlatformMode());
  const { error } = await createServerSupabaseClient().rpc("teamalum_link_stripe_account", {
    p_client_id: clientId, p_account_id: account.id, p_status: getStripeAccountStatus(account), p_metadata: metadata,
  });
  if (error) throw new Error(error.message);
  return metadata;
}

export async function verifyClientStripeAccount(clientId: string, integration: ClientIntegration | null | undefined) {
  if (!isVerifiedStripeMapping(clientId, integration, stripePlatformMode())) throw new Error("This site's Stripe account is not verified for payments and payouts. The owner or HQ must check its connection in Studio Payments.");
  const account = await retrieveConnectedAccount(integration!.external_account_id!);
  if (account.id !== integration!.external_account_id || getStripeAccountStatus(account) !== "connected") throw new Error("Stripe reports that this site's payments or payouts need attention. No payment was started.");
  if (account.metadata?.teamalum_client_id && account.metadata.teamalum_client_id !== clientId) throw new Error("Stripe account does not match this site.");
  return account;
}

export async function refreshClientStripeConnection(clientId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("client_integrations").select("external_account_id").eq("client_id", clientId).eq("integration_key", "stripe_connect").maybeSingle();
  if (error || !data?.external_account_id) throw new Error("No Stripe account is linked to this organization yet.");
  const account = await retrieveConnectedAccount(data.external_account_id);
  await saveVerifiedStripeConnection(clientId, account);
  return account;
}

export async function handleStripeAccountEvent(event: { type: string; account?: string; livemode?: boolean; data?: { object?: unknown } }) {
  const mode = stripePlatformMode();
  if (event.livemode !== (mode === "live")) return;
  const object = event.data?.object as { id?: string } | undefined;
  const accountId = event.account;
  if (!accountId || (event.type === "account.updated" && object?.id !== accountId)) throw new Error("Invalid connected account event.");
  const supabase = createServerSupabaseClient();
  const { data: mappings, error } = await supabase.from("client_integrations").select("client_id, metadata").eq("integration_key", "stripe_connect").eq("external_account_id", accountId);
  if (error) throw new Error(error.message);
  for (const mapping of mappings ?? []) {
    if (mapping.metadata?.verification_mode && mapping.metadata.verification_mode !== mode) continue;
    if (event.type === "account.application.deauthorized") {
      const { error: disableError } = await supabase.from("client_integrations").update({ status: "disabled", metadata: { ...mapping.metadata, charges_enabled: false, payouts_enabled: false, disabled_reason: "deauthorized", last_checked_at: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq("client_id", mapping.client_id).eq("integration_key", "stripe_connect").eq("external_account_id", accountId);
      if (disableError) throw new Error(disableError.message);
    } else {
      // Read current state rather than applying an older webhook snapshot.
      await saveVerifiedStripeConnection(mapping.client_id, await retrieveConnectedAccount(accountId));
    }
  }
}
