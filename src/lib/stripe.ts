import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getClientIntegration } from "@/lib/client-integrations";
import { getCurrentClientId } from "@/lib/client-context";
import { getSiteBrand } from "@/lib/site-brand";
import { getServerEnvValue } from "@/lib/supabase/server";

type StripeCheckoutSessionInput = {
  additionalGiftAmountCents?: number;
  cancelUrl: string;
  contactId: string;
  customerEmail: string;
  membershipAmountCents: number;
  membershipLabel: string;
  successUrl: string;
};

export type StripeCheckoutSession = {
  id: string;
  stripeAccountId?: string;
  url: string | null;
};

export type StripeCheckoutSessionCompleted = {
  amount_total?: number | null;
  client_reference_id?: string | null;
  customer?: string | null;
  id: string;
  livemode?: boolean;
  metadata?: Record<string, string>;
  payment_status?: string;
  subscription?: string | null;
};

export type StripeWebhookEvent = {
  account?: string;
  data?: {
    object?: unknown;
  };
  id: string;
  type: string;
};

export type StripeInvoicePaid = {
  amount_paid?: number | null;
  billing_reason?: string | null;
  customer?: string | null;
  id: string;
  livemode?: boolean;
  subscription?: string | null;
};

export type StripeSubscription = {
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
  customer?: string | null;
  current_period_end?: number | null;
  id: string;
  livemode?: boolean;
  status?: string | null;
};

export function getStripeSecretKey() {
  return getServerEnvValue("STRIPE_SECRET_KEY");
}

export function getStripeMode() {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    return "mock";
  }

  return secretKey.startsWith("sk_test_") ? "sandbox" : "live";
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey());
}

export function getStripeWebhookSecret() {
  return getServerEnvValue("STRIPE_WEBHOOK_SECRET");
}

async function getStripeConnectedAccountId(clientId: string) {
  const integration = await getClientIntegration(clientId, "stripe_connect");

  if (
    integration?.status === "connected" &&
    integration.external_account_id?.startsWith("acct_")
  ) {
    return integration.external_account_id;
  }

  return getServerEnvValue("STRIPE_CONNECTED_ACCOUNT_ID");
}

function getStripeApplicationFeePercent() {
  return getServerEnvValue("STRIPE_APPLICATION_FEE_PERCENT");
}

async function getRequiredClientStripeAccountId(clientId: string) {
  const connectedAccountId = await getStripeConnectedAccountId(clientId);

  if (!connectedAccountId) {
    throw new Error(
      "Stripe is not connected for this site yet. Connect the client's Stripe account in Studio before opening membership checkout.",
    );
  }

  return connectedAccountId;
}

function getStripeRequestHeaders({
  connectedAccountId,
  secretKey,
}: {
  connectedAccountId?: string | null;
  secretKey: string;
}) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    ...(connectedAccountId ? { "Stripe-Account": connectedAccountId } : {}),
  };
}

export async function createStripeCheckoutSession({
  additionalGiftAmountCents = 0,
  cancelUrl,
  contactId,
  customerEmail,
  membershipAmountCents,
  membershipLabel,
  successUrl,
}: StripeCheckoutSessionInput) {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const brand = getSiteBrand();
  const clientId = getCurrentClientId();
  const connectedAccountId = await getRequiredClientStripeAccountId(clientId);
  const applicationFeePercent = getStripeApplicationFeePercent();
  const body = new URLSearchParams();
  body.set("cancel_url", cancelUrl);
  body.set("client_reference_id", contactId);
  body.set("customer_email", customerEmail);
  body.set("line_items[0][price_data][currency]", "cad");
  body.set("line_items[0][price_data][product_data][name]", membershipLabel);
  body.set("line_items[0][price_data][recurring][interval]", "year");
  body.set(
    "line_items[0][price_data][unit_amount]",
    String(membershipAmountCents),
  );
  body.set("line_items[0][quantity]", "1");
  body.set(
    "metadata[additional_gift_amount_cents]",
    String(additionalGiftAmountCents),
  );
  body.set("metadata[client_id]", clientId);
  body.set("metadata[contact_id]", contactId);
  body.set("metadata[membership_amount_cents]", String(membershipAmountCents));
  body.set("metadata[membership_label]", membershipLabel);
  body.set("metadata[program]", brand.programName);
  body.set("metadata[site_variant]", brand.variant);
  body.set("mode", "subscription");
  body.set("subscription_data[metadata][client_id]", clientId);
  body.set("subscription_data[metadata][contact_id]", contactId);
  body.set(
    "subscription_data[metadata][membership_amount_cents]",
    String(membershipAmountCents),
  );
  body.set("subscription_data[metadata][program]", brand.programName);
  body.set("subscription_data[metadata][site_variant]", brand.variant);

  if (applicationFeePercent) {
    body.set(
      "subscription_data[application_fee_percent]",
      applicationFeePercent,
    );
  }

  body.set("submit_type", "subscribe");
  body.set("success_url", successUrl);

  if (additionalGiftAmountCents > 0) {
    body.set("line_items[1][price_data][currency]", "cad");
    body.set(
      "line_items[1][price_data][product_data][name]",
      `Additional one-time gift to ${brand.programName}`,
    );
    body.set(
      "line_items[1][price_data][unit_amount]",
      String(additionalGiftAmountCents),
    );
    body.set("line_items[1][quantity]", "1");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body,
    headers: getStripeRequestHeaders({ connectedAccountId, secretKey }),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as
    | (StripeCheckoutSession & { error?: { message?: string } })
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Stripe rejected the Checkout Session with status ${response.status}.`,
    );
  }

  if (!payload?.id || !payload.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  return {
    id: payload.id,
    stripeAccountId: connectedAccountId,
    url: payload.url,
  };
}

export async function createStripeCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const body = new URLSearchParams();
  body.set("customer", customerId);
  body.set("return_url", returnUrl);
  const connectedAccountId = await getRequiredClientStripeAccountId(
    getCurrentClientId(),
  );

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    body,
    headers: getStripeRequestHeaders({ connectedAccountId, secretKey }),
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; id?: string; url?: string | null }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Stripe rejected the Customer Portal Session with status ${response.status}.`,
    );
  }

  if (!payload?.url) {
    throw new Error("Stripe did not return a Customer Portal URL.");
  }

  return {
    id: payload.id,
    url: payload.url,
  };
}

function parseStripeSignature(header: string) {
  return header.split(",").reduce(
    (parts, entry) => {
      const [key, value] = entry.split("=");

      if (key === "t") {
        parts.timestamp = value;
      }

      if (key === "v1") {
        parts.signatures.push(value);
      }

      return parts;
    },
    { signatures: [] as string[], timestamp: "" },
  );
}

function isSameSignature(value: string, expected: string) {
  const valueBuffer = Buffer.from(value, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export function constructStripeWebhookEvent({
  payload,
  signature,
  webhookSecret,
}: {
  payload: string;
  signature: string | null;
  webhookSecret: string;
}) {
  if (!signature) {
    throw new Error("Missing Stripe-Signature header.");
  }

  const { signatures, timestamp } = parseStripeSignature(signature);

  if (!timestamp || !signatures.length) {
    throw new Error("Invalid Stripe-Signature header.");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");
  const isVerified = signatures.some((value) =>
    isSameSignature(value, expectedSignature),
  );

  if (!isVerified) {
    throw new Error("Stripe webhook signature verification failed.");
  }

  return JSON.parse(payload) as StripeWebhookEvent;
}
