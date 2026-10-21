import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServerSupabaseClient, getServerEnvValue } from "@/lib/supabase/server";
import { getClientIntegration } from "@/lib/client-integrations";
import { exchangeStripeOAuthCode, retrieveConnectedAccount, stripePlatformMode } from "@/lib/stripe-connect";
import { saveVerifiedStripeConnection } from "@/lib/stripe-connection";

const cookieName = "teamalum_stripe_oauth_state";
function digest(state: string) { return createHash("sha256").update(state).digest("hex"); }
export async function beginStripeOAuth(clientId: string, ownerId: string, origin: string) {
  const clientKey = getServerEnvValue("STRIPE_CONNECT_CLIENT_ID");
  if (!clientKey?.startsWith("ca_")) throw new Error("Existing-account authorization is not configured yet. Ask HQ to configure Stripe Connect OAuth before creating another Stripe account.");
  const existing = await getClientIntegration(clientId, "stripe_connect");
  const state = randomBytes(32).toString("hex");
  const { error } = await createServerSupabaseClient().from("stripe_oauth_states").insert({ state_hash: digest(state), client_id: clientId, owner_id: ownerId, callback_origin: origin, previous_account_id: existing?.external_account_id ?? null, mode: stripePlatformMode(), expires_at: new Date(Date.now()+10*60*1000).toISOString() });
  if (error) throw new Error("Unable to start secure Stripe authorization. Apply the setup reliability migration.");
  (await cookies()).set(cookieName, state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/studio" });
  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.search = new URLSearchParams({ response_type: "code", client_id: clientKey, scope: "read_write", stripe_landing: "login", state, redirect_uri: `${origin}/studio/${encodeURIComponent(clientId)}/payments/oauth/callback` }).toString();
  return url.toString();
}

export async function finishStripeOAuth(clientId: string, ownerId: string, origin: string, state: string, code: string) {
  const cookie = (await cookies()).get(cookieName)?.value ?? "";
  if (!/^[a-f0-9]{64}$/.test(state) || cookie.length !== state.length || !timingSafeEqual(Buffer.from(state),Buffer.from(cookie))) throw new Error("Stripe authorization expired or did not match this browser. Start again from Payments.");
  const { data, error } = await createServerSupabaseClient().from("stripe_oauth_states").delete().eq("state_hash", digest(state)).eq("client_id", clientId).eq("owner_id", ownerId).eq("callback_origin", origin).gt("expires_at", new Date().toISOString()).select("previous_account_id, mode").maybeSingle();
  if (error || !data || data.mode !== stripePlatformMode()) throw new Error("Stripe authorization was already used, expired, or belongs to another account.");
  (await cookies()).set(cookieName, "", { path: "/studio", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0 });
  const accountId = await exchangeStripeOAuthCode(code);
  if (data.previous_account_id && data.previous_account_id !== accountId) throw new Error("You selected a different Stripe account. The existing account was kept; contact HQ before migrating active memberships.");
  await saveVerifiedStripeConnection(clientId, await retrieveConnectedAccount(accountId));
}
