import { NextResponse } from "next/server";
import { logContactActivity } from "@/lib/contact-activity";
import { isValidContact } from "@/lib/contact-validation";
import { getMembershipSettings } from "@/lib/membership-settings";
import {
  createStripeCheckoutSession,
  getStripeMode,
  isStripeConfigured,
} from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getOrigin(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const contact = await request.json();

    if (!isValidContact(contact)) {
      return NextResponse.json(
        { error: "Please check the membership form fields and try again." },
        { status: 400 },
      );
    }

    const settings = await getMembershipSettings();

    if (!settings.join_is_open) {
      return NextResponse.json(
        { error: "Membership signups are currently closed." },
        { status: 403 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("contacts")
      .upsert(
        {
          ...contact,
          annual_dues_amount_cents: settings.annual_membership_amount_cents,
          membership_status: "Pending Payment",
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await logContactActivity({
        body: `${settings.membership_year_label} started. Amount: ${settings.annual_membership_amount_cents} cents.`,
        contactId: data.id,
        metadata: {
          amount_cents: settings.annual_membership_amount_cents,
          mode: isStripeConfigured() ? getStripeMode() : "mock",
          source: "join",
        },
        title: "Membership checkout started",
        type: "membership_checkout_started",
      });
    } catch {
      // Activity logging should not block the membership flow.
    }

    if (isStripeConfigured()) {
      const origin = getOrigin(request);
      const checkoutSession = await createStripeCheckoutSession({
        amountCents: settings.annual_membership_amount_cents,
        cancelUrl: `${origin}/join`,
        contactId: data.id,
        customerEmail: contact.email,
        membershipLabel: settings.membership_year_label,
        successUrl: `${origin}/membership/success?contact_id=${data.id}&session_id={CHECKOUT_SESSION_ID}`,
      });

      await supabase
        .from("contacts")
        .update({
          stripe_checkout_session_id: checkoutSession.id,
        })
        .eq("id", data.id);

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        contactId: data.id,
        mode: getStripeMode(),
        ok: true,
      });
    }

    return NextResponse.json({
      checkoutUrl: `/membership/mock-checkout?contact_id=${data.id}`,
      contactId: data.id,
      mode: "mock",
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start membership checkout.",
      },
      { status: 500 },
    );
  }
}
