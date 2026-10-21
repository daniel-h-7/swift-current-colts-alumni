import "server-only";

import { getServerEnvValue } from "@/lib/supabase/server";

export type StripeConnectedAccount = {
  charges_enabled?: boolean;
  details_submitted?: boolean;
  id: string;
  metadata?: Record<string, string>;
  type?: string;
  payouts_enabled?: boolean;
  requirements?: {
    currently_due?: string[];
    disabled_reason?: string | null;
    past_due?: string[];
  };
};

type CreateStandardConnectedAccountInput = {
  clientId: string;
  email: string;
  name: string;
  websiteUrl?: string | null;
  idempotencyKey: string;
};

type CreateAccountLinkInput = {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
};

function getStripePlatformSecretKey() {
  return getServerEnvValue("STRIPE_SECRET_KEY");
}

function getRequiredStripePlatformSecretKey() {
  const secretKey = getStripePlatformSecretKey();

  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add the TeamAlum platform Stripe key in Vercel, then redeploy.",
    );
  }

  return secretKey;
}

async function stripeRequest<T>({
  body,
  method = "POST",
  path,
  idempotencyKey,
}: {
  body?: URLSearchParams;
  idempotencyKey?: string;
  method?: "GET" | "POST";
  path: string;
}) {
  const secretKey = getRequiredStripePlatformSecretKey();
  const response = await fetch(`https://api.stripe.com${path}`, {
    body,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    method,
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Stripe rejected the request with status ${response.status}.`,
    );
  }

  if (!payload) {
    throw new Error("Stripe did not return a response.");
  }

  return payload;
}

export async function createStandardConnectedAccount({
  clientId,
  email,
  name,
  websiteUrl,
  idempotencyKey,
}: CreateStandardConnectedAccountInput) {
  const body = new URLSearchParams();
  body.set("type", "standard");
  body.set("email", email);
  body.set("business_profile[name]", name);
  body.set("metadata[teamalum_client_id]", clientId);

  if (websiteUrl) {
    body.set("business_profile[url]", websiteUrl);
  }

  return stripeRequest<StripeConnectedAccount>({
    body,
    path: "/v1/accounts",
    idempotencyKey,
  });
}

export async function createStripeAccountOnboardingLink({
  accountId,
  refreshUrl,
  returnUrl,
}: CreateAccountLinkInput) {
  const body = new URLSearchParams();
  body.set("account", accountId);
  body.set("refresh_url", refreshUrl);
  body.set("return_url", returnUrl);
  body.set("type", "account_onboarding");

  return stripeRequest<{ url: string }>({
    body,
    path: "/v1/account_links",
  });
}

export async function retrieveConnectedAccount(accountId: string) {
  return stripeRequest<StripeConnectedAccount>({
    method: "GET",
    path: `/v1/accounts/${encodeURIComponent(accountId)}`,
  });
}

export function getStripeAccountStatus(account: StripeConnectedAccount) {
  if (account.requirements?.disabled_reason || account.requirements?.past_due?.length) return "needs_attention";
  if (account.charges_enabled && account.payouts_enabled && account.details_submitted) return "connected";
  return "pending";
}

export function stripePlatformMode() {
  const key = getRequiredStripePlatformSecretKey();
  if (!/^(?:sk|rk)_(?:test|live)_/.test(key)) throw new Error("Stripe platform key is not a recognized live or test key.");
  return key.includes("_test_") ? "sandbox" : "live";
}

export async function exchangeStripeOAuthCode(code: string) {
  const response = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_secret: getRequiredStripePlatformSecretKey(), code, grant_type: "authorization_code" }),
  });
  const result = await response.json() as { stripe_user_id?: string; livemode?: boolean; error?: string };
  if (!response.ok || !result.stripe_user_id) throw new Error("Stripe could not authorize this account. It may be controlled by another platform. Your existing connection was not replaced.");
  if (result.livemode !== (stripePlatformMode() === "live")) throw new Error("Stripe authorization mode does not match this deployment.");
  return result.stripe_user_id;
}
