import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
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
  body.set("metadata[contact_id]", contactId);
  body.set("metadata[membership_amount_cents]", String(membershipAmountCents));
  body.set("metadata[membership_label]", membershipLabel);
  body.set("mode", "subscription");
  body.set("subscription_data[metadata][contact_id]", contactId);
  body.set(
    "subscription_data[metadata][membership_amount_cents]",
    String(membershipAmountCents),
  );
  body.set("submit_type", "subscribe");
  body.set("success_url", successUrl);

  if (additionalGiftAmountCents > 0) {
    body.set("line_items[1][price_data][currency]", "cad");
    body.set(
      "line_items[1][price_data][product_data][name]",
      "Additional one-time gift to Colts Football",
    );
    body.set(
      "line_items[1][price_data][unit_amount]",
      String(additionalGiftAmountCents),
    );
    body.set("line_items[1][quantity]", "1");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    body,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
