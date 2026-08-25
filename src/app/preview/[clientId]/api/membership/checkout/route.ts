import { NextResponse } from "next/server";
import { logContactActivity } from "@/lib/contact-activity";
import { ContactInsert } from "@/lib/contact-options";
import { isValidContact } from "@/lib/contact-validation";
import { getMembershipSettingsForClient } from "@/lib/membership-settings";
import { getPlatformClient } from "@/lib/platform-data";
import {
  createStripeCheckoutSession,
  getStripeMode,
  isStripeConfigured,
} from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteParams = {
  clientId: string;
};

type CheckoutRequest = ContactInsert & {
  additional_gift_amount_cents?: number;
};

function getOrigin(request: Request) {
  return new URL(request.url).origin;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const { clientId } = await params;
    const client = await getPlatformClient(clientId);

    if (!client) {
      return NextResponse.json(
        { error: "Client site not found." },
        { status: 404 },
      );
    }

    const payload = (await request.json()) as CheckoutRequest;
    const additionalGiftAmountCents = Math.max(
      0,
      Math.round(Number(payload.additional_gift_amount_cents ?? 0)),
    );
    const contact = { ...payload };
    delete contact.additional_gift_amount_cents;

    if (!isValidContact(contact)) {
      return NextResponse.json(
        { error: "Please check the membership form fields and try again." },
        { status: 400 },
      );
    }

    const settings = await getMembershipSettingsForClient(clientId);

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
          client_id: clientId,
          membership_status: "Pending Payment",
        },
        { onConflict: "client_id,email" },
      )
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logContactActivity({
      body: `${settings.membership_year_label} preview checkout started. Amount: ${settings.annual_membership_amount_cents} cents.`,
      clientId,
      contactId: data.id,
      metadata: {
        amount_cents: settings.annual_membership_amount_cents,
        additional_gift_amount_cents: additionalGiftAmountCents,
        mode: isStripeConfigured() ? getStripeMode() : "mock",
        source: "preview_join",
      },
      title: "Preview membership checkout started",
      type: "membership_checkout_started",
    }).catch(() => undefined);

    if (isStripeConfigured()) {
      const origin = getOrigin(request);
      const checkoutSession = await createStripeCheckoutSession({
        additionalGiftAmountCents,
        cancelUrl: `${origin}/preview/${encodeURIComponent(clientId)}#join`,
        clientId,
        contactId: data.id,
        customerEmail: contact.email,
        membershipAmountCents: settings.annual_membership_amount_cents,
        membershipLabel: "Annual Membership",
        programName: client.name,
        siteVariant: client.site_variant,
        successUrl: `${origin}/preview/${encodeURIComponent(clientId)}?checkout=success&contact_id=${data.id}&session_id={CHECKOUT_SESSION_ID}`,
      });

      await supabase
        .from("contacts")
        .update({
          stripe_account_id: checkoutSession.stripeAccountId ?? null,
          stripe_checkout_session_id: checkoutSession.id,
        })
        .eq("client_id", clientId)
        .eq("id", data.id);

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        contactId: data.id,
        mode: getStripeMode(),
        ok: true,
      });
    }

    return NextResponse.json({
      checkoutUrl: `/membership/mock-checkout?contact_id=${data.id}&gift_cents=${additionalGiftAmountCents}`,
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
