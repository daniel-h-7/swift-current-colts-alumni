import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnvValue } from "@/lib/supabase/server";

type StripeCheckoutSessionInput = {
  amountCents: number;
  cancelUrl: string;
  contactId: string;
  customerEmail: string;
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
};

export type StripeWebhookEvent = {
  data?: {
    object?: unknown;
  };
  id: string;
  type: string;
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
  amountCents,
  cancelUrl,
  contactId,
  customerEmail,
  membershipLabel,
  successUrl,
}: StripeCheckoutSessionInput) {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const body = new URLSearchParams({
    cancel_url: cancelUrl,
    client_reference_id: contactId,
    customer_creation: "always",
    customer_email: customerEmail,
    "line_items[0][price_data][currency]": "cad",
    "line_items[0][price_data][product_data][name]": membershipLabel,
    "line_items[0][price_data][unit_amount]": String(amountCents),
    "line_items[0][quantity]": "1",
    "metadata[contact_id]": contactId,
    "metadata[membership_label]": membershipLabel,
    mode: "payment",
    success_url: successUrl,
  });

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
