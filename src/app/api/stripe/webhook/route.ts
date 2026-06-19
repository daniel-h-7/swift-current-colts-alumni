import { NextResponse } from "next/server";
import { logContactActivity } from "@/lib/contact-activity";
import {
  constructStripeWebhookEvent,
  getStripeWebhookSecret,
  StripeCheckoutSessionCompleted,
} from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getPaidThroughDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
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

async function activateMembership(session: StripeCheckoutSessionCompleted) {
  const contactId = session.metadata?.contact_id || session.client_reference_id;

  if (!contactId) {
    throw new Error("Stripe session is missing contact metadata.");
  }

  const now = new Date().toISOString();
  const paidThrough = getPaidThroughDate();
  const amountCents = session.amount_total ?? 0;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      annual_dues_amount_cents: amountCents,
      last_payment_at: now.slice(0, 10),
      membership_status: "Active Member",
      paid_through: paidThrough,
      stripe_checkout_session_id: session.id,
      stripe_customer_id: session.customer ?? null,
    })
    .eq("id", contactId);

  if (error) {
    throw new Error(error.message);
  }

  try {
    await logContactActivity({
      body: `Stripe payment completed. Paid through ${paidThrough}.`,
      contactId,
      metadata: {
        amount_cents: amountCents,
        paid_through: paidThrough,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: session.customer ?? null,
        stripe_livemode: session.livemode ?? false,
      },
      title: "Membership payment completed",
      type: "membership_payment_completed",
    });
  } catch {
    // Activity logging should not block webhook acknowledgement.
  }
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

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;

      if (!isCheckoutSessionCompleted(session)) {
        throw new Error("Invalid Stripe Checkout Session payload.");
      }

      await activateMembership(session);
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
