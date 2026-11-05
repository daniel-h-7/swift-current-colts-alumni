import { NextResponse } from "next/server";
import { getPlatformClientByStudioSlug } from "@/lib/platform-data";
import { logContactActivity } from "@/lib/contact-activity";
import { formatFromEmail, getEmailSettingsForClient } from "@/lib/email-settings";
import {
  isEmailDeliveryConfigured,
  sendCampaignTestEmail,
} from "@/lib/email-provider";

import { createStripeCustomerPortalSession, isStripeConfigured } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createUnsubscribeUrl } from "@/lib/unsubscribe";


function getGenericResponse() {
  return NextResponse.json({
    ok: true,
  });
}

export async function sendMembershipManagementLink(request: Request, clientId: string) {
  const client = await getPlatformClientByStudioSlug(clientId);
  if (!client?.launch_approved_at) return NextResponse.json({ error: "Membership management is unavailable for this site." }, { status: 404 });
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return NextResponse.json({ error: "Submit from the membership management page." }, { status: 403 });
  try {
    const payload = (await request.json()) as { email?: string };
    const email = payload.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Enter the email used for your membership." },
        { status: 400 },
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe membership management is not configured yet." },
        { status: 500 },
      );
    }

    if (!isEmailDeliveryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Membership management email is temporarily unavailable. Please contact your team for help.",
        },
        { status: 503 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: contact, error } = await supabase
      .from("contacts")
      .select("id, email, first_name, stripe_customer_id, stripe_account_id")
      .eq("client_id", client.id)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!contact?.stripe_customer_id) {
      return getGenericResponse();
    }

    const portalSession = await createStripeCustomerPortalSession({
      customerId: contact.stripe_customer_id,
      clientId: client.id,
      expectedAccountId: contact.stripe_account_id,
      returnUrl: `${origin}/site/${encodeURIComponent(client.id)}/membership/manage`,
    });
    const emailSettings = await getEmailSettingsForClient(client.id);
    const program = client.name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

    await sendCampaignTestEmail({
      from: formatFromEmail(emailSettings),
      html: `
        <h2 style="margin:0 0 14px;font-size:24px;line-height:1.2;font-weight:900;color:#0f172a;">Manage your ${program} membership</h2>
        <p style="margin:0 0 16px;">Use the secure Stripe link below to update your payment method or cancel future annual renewals.</p>
        <p style="margin:0 0 18px;"><a href="${portalSession.url}" style="display:inline-block;background:#171917;border:1px solid #c5a45b;color:#ffffff;padding:12px 16px;text-decoration:none;font-weight:900;">Open Membership Management</a></p>
        <p style="margin:0;color:#4b5563;">If you did not request this link, you can ignore this email.</p>
      `.trim(),
      preheader: "Your secure Stripe membership management link.",
      replyTo: emailSettings.email_reply_to,
      subject: `Manage your ${client.name} membership`,
      to: contact.email,
      unsubscribeUrl: createUnsubscribeUrl(contact.id, client.id),
    });

    await logContactActivity({
      body: "Stripe Customer Portal management link emailed to member.",
      clientId: client.id,
      contactId: contact.id,
      metadata: {
        portal_session_id: portalSession.id ?? null,
        source: "membership_portal_request",
        stripe_customer_id: contact.stripe_customer_id,
      },
      title: "Membership management link sent",
      type: "membership_portal_link_sent",
    }).catch(() => undefined);

    return getGenericResponse();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send the management link.",
      },
      { status: 500 },
    );
  }
}
