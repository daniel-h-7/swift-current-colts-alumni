import { NextResponse } from "next/server";
import { logContactActivity } from "@/lib/contact-activity";
import { isValidContact } from "@/lib/contact-validation";
import { getMembershipSettings } from "@/lib/membership-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
          mode: "mock",
          source: "join",
        },
        title: "Membership checkout started",
        type: "membership_checkout_started",
      });
    } catch {
      // Activity logging should not block the membership flow.
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
