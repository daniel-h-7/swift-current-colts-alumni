import { NextResponse } from "next/server";
import { getCurrentClientId } from "@/lib/client-context";
import { logContactActivity } from "@/lib/contact-activity";
import { formatCurrencyFromCents } from "@/lib/contact-format";
import { runNewSignupAutomation } from "@/lib/new-signup-automation";
import {
  constructStripeWebhookEvent,
  getStripeWebhookSecret,
  StripeCheckoutSessionCompleted,
  StripeInvoicePaid,
  StripeSubscription,
} from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getPaidThroughDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function getRenewedPaidThroughDate(value?: string | null) {
  const baseDate = value ? new Date(`${value}T00:00:00.000Z`) : new Date();

  if (Number.isNaN(baseDate.getTime()) || baseDate < new Date()) {
    return getPaidThroughDate();
  }

  baseDate.setFullYear(baseDate.getFullYear() + 1);
  return baseDate.toISOString().slice(0, 10);
}

function isCheckoutSessionCompleted(
  value: unknown,
): value is StripeCheckoutSessionCompleted {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string",
  );
}

function isInvoicePaid(value: unknown): value is StripeInvoicePaid {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string",
  );
}

function isStripeSubscription(value: unknown): value is StripeSubscription {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string",
  );
}

function getWebhookClientId(value?: string | null) {
  return value?.trim() || getCurrentClientId();
}

async function getContactByStripeCustomer({
  customerId,
  stripeAccountId,
}: {
  customerId: string;
  stripeAccountId?: string;
}) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("contacts")
    .select("id, client_id, paid_through")
    .eq("stripe_customer_id", customerId);

  if (stripeAccountId) {
    query = query.eq("stripe_account_id", stripeAccountId);
  } else {
    query = query.eq("client_id", getCurrentClientId());
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as
    | { client_id: string; id: string; paid_through?: string | null }
    | null;
}

async function activateMembership(
  session: StripeCheckoutSessionCompleted,
  stripeAccountId?: string,
) {
  const contactId = session.metadata?.contact_id || session.client_reference_id;
  const clientId = getWebhookClientId(session.metadata?.client_id);

  if (!contactId) {
    throw new Error("Stripe session is missing contact metadata.");
  }

  const now = new Date().toISOString();
  const paidThrough = getPaidThroughDate();
  const membershipAmountCents = Number(
    session.metadata?.membership_amount_cents ?? session.amount_total ?? 0,
  );
  const additionalGiftAmountCents = Number(
    session.metadata?.additional_gift_amount_cents ?? 0,
  );
  const totalAmountCents = session.amount_total ?? membershipAmountCents;
  const supabase = createServerSupabaseClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("gift_donation_amount_cents")
    .eq("client_id", clientId)
    .eq("id", contactId)
    .maybeSingle();
  const contactUpdates = {
    annual_dues_amount_cents: membershipAmountCents,
    gift_donation_amount_cents:
      additionalGiftAmountCents > 0
        ? Number(contact?.gift_donation_amount_cents ?? 0) +
          additionalGiftAmountCents
        : Number(contact?.gift_donation_amount_cents ?? 0),
    last_payment_at: now.slice(0, 10),
    membership_status: "Active Member",
    paid_through: paidThrough,
    stripe_account_id: stripeAccountId ?? null,
    stripe_checkout_session_id: session.id,
    stripe_customer_id: session.customer ?? null,
  };
  const { error } = await supabase
    .from("contacts")
    .update(contactUpdates)
    .eq("client_id", clientId)
    .eq("id", contactId);

  if (error) {
    throw new Error(error.message);
  }

  try {
    await logContactActivity({
      body:
        additionalGiftAmountCents > 0
          ? `Stripe membership completed. One-time gift ${formatCurrencyFromCents(additionalGiftAmountCents)}. Paid through ${paidThrough}.`
          : `Stripe membership completed. Paid through ${paidThrough}.`,
      contactId,
      clientId,
      metadata: {
        amount_cents: totalAmountCents,
        additional_gift_amount_cents: additionalGiftAmountCents,
        membership_amount_cents: membershipAmountCents,
        paid_through: paidThrough,
        stripe_checkout_session_id: session.id,
        stripe_account_id: stripeAccountId ?? null,
        stripe_customer_id: session.customer ?? null,
        stripe_livemode: session.livemode ?? false,
        stripe_subscription_id: session.subscription ?? null,
        total_amount_cents: totalAmountCents,
      },
      title: "Membership payment completed",
      type: "membership_payment_completed",
    });
  } catch {
    // Activity logging should not block webhook acknowledgement.
  }

  if (additionalGiftAmountCents > 0) {
    await logContactActivity({
      body: `One-time gift ${formatCurrencyFromCents(additionalGiftAmountCents)}.`,
      clientId,
      contactId,
      metadata: {
        amount_cents: additionalGiftAmountCents,
        mode: "stripe",
        stripe_account_id: stripeAccountId ?? null,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: session.customer ?? null,
        stripe_livemode: session.livemode ?? false,
        stripe_subscription_id: session.subscription ?? null,
      },
      title: "One-time gift received",
      type: "gift_donation_received",
    }).catch(() => undefined);
  }

  await runNewSignupAutomation({
    clientId,
    contactId,
    source: "stripe",
  }).catch(() => undefined);
}

async function renewMembership(
  invoice: StripeInvoicePaid,
  stripeAccountId?: string,
) {
  if (!invoice.customer || invoice.billing_reason === "subscription_create") {
    return;
  }

  const supabase = createServerSupabaseClient();
  const contact = await getContactByStripeCustomer({
    customerId: invoice.customer,
    stripeAccountId,
  });

  if (!contact?.id) {
    return;
  }
  const clientId = contact.client_id;

  const { data: existingRenewal, error: existingRenewalError } = await supabase
    .from("contact_activities")
    .select("id")
    .eq("client_id", clientId)
    .eq("contact_id", contact.id)
    .eq("activity_type", "membership_subscription_renewed")
    .contains("metadata", { stripe_invoice_id: invoice.id })
    .maybeSingle();

  if (existingRenewalError) {
    throw new Error(existingRenewalError.message);
  }

  if (existingRenewal?.id) {
    return;
  }

  const now = new Date().toISOString();
  const paidThrough = getRenewedPaidThroughDate(
    typeof contact.paid_through === "string" ? contact.paid_through : null,
  );
  const { error } = await supabase
    .from("contacts")
    .update({
      last_payment_at: now.slice(0, 10),
      membership_status: "Active Member",
      paid_through: paidThrough,
    })
    .eq("client_id", clientId)
    .eq("id", contact.id);

  if (error) {
    throw new Error(error.message);
  }

  await logContactActivity({
    body: `Stripe subscription renewal paid. Paid through ${paidThrough}.`,
    contactId: contact.id,
    metadata: {
      amount_cents: invoice.amount_paid ?? 0,
      billing_reason: invoice.billing_reason ?? null,
      paid_through: paidThrough,
      stripe_account_id: stripeAccountId ?? null,
      stripe_customer_id: invoice.customer,
      stripe_invoice_id: invoice.id,
      stripe_livemode: invoice.livemode ?? false,
      stripe_subscription_id: invoice.subscription ?? null,
    },
    title: "Membership subscription renewed",
    type: "membership_subscription_renewed",
    clientId,
  }).catch(() => undefined);
}

function getDateFromStripeTimestamp(value?: number | null) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString().slice(0, 10);
}

async function recordSubscriptionUpdated(
  subscription: StripeSubscription,
  stripeAccountId?: string,
) {
  if (!subscription.customer) {
    return;
  }

  const contact = await getContactByStripeCustomer({
    customerId: subscription.customer,
    stripeAccountId,
  });

  if (!contact?.id || !subscription.cancel_at_period_end) {
    return;
  }
  const clientId = contact.client_id;

  await logContactActivity({
    body: "Stripe subscription is set to cancel at the end of the current paid period.",
    contactId: contact.id,
    clientId,
    metadata: {
      cancel_at_period_end: true,
      current_period_end: getDateFromStripeTimestamp(
        subscription.current_period_end,
      ),
      stripe_account_id: stripeAccountId ?? null,
      stripe_customer_id: subscription.customer,
      stripe_livemode: subscription.livemode ?? false,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status ?? null,
    },
    title: "Membership cancellation scheduled",
    type: "membership_cancellation_scheduled",
  }).catch(() => undefined);
}

async function cancelMembership(
  subscription: StripeSubscription,
  stripeAccountId?: string,
) {
  if (!subscription.customer) {
    return;
  }

  const supabase = createServerSupabaseClient();
  const contact = await getContactByStripeCustomer({
    customerId: subscription.customer,
    stripeAccountId,
  });

  if (!contact?.id) {
    return;
  }
  const clientId = contact.client_id;

  const { error } = await supabase
    .from("contacts")
    .update({
      membership_status: "Expired",
    })
    .eq("client_id", clientId)
    .eq("id", contact.id);

  if (error) {
    throw new Error(error.message);
  }

  await logContactActivity({
    body: "Stripe subscription was canceled. Membership status set to Expired.",
    contactId: contact.id,
    clientId,
    metadata: {
      canceled_at: getDateFromStripeTimestamp(subscription.canceled_at),
      current_period_end: getDateFromStripeTimestamp(
        subscription.current_period_end,
      ),
      stripe_account_id: stripeAccountId ?? null,
      stripe_customer_id: subscription.customer,
      stripe_livemode: subscription.livemode ?? false,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status ?? null,
    },
    title: "Membership canceled",
    type: "membership_subscription_canceled",
  }).catch(() => undefined);
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 },
    );
  }

  const payload = await request.text();

  try {
    const event = constructStripeWebhookEvent({
      payload,
      signature: request.headers.get("stripe-signature"),
      webhookSecret,
    });
    const stripeAccountId = event.account;

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;

      if (!isCheckoutSessionCompleted(session)) {
        throw new Error("Invalid Stripe Checkout Session payload.");
      }

      await activateMembership(session, stripeAccountId);
    }

    if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_succeeded"
    ) {
      const invoice = event.data?.object;

      if (!isInvoicePaid(invoice)) {
        throw new Error("Invalid Stripe invoice payload.");
      }

      await renewMembership(invoice, stripeAccountId);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data?.object;

      if (!isStripeSubscription(subscription)) {
        throw new Error("Invalid Stripe subscription payload.");
      }

      await recordSubscriptionUpdated(subscription, stripeAccountId);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data?.object;

      if (!isStripeSubscription(subscription)) {
        throw new Error("Invalid Stripe subscription payload.");
      }

      await cancelMembership(subscription, stripeAccountId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook.",
      },
      { status: 400 },
    );
  }
}
